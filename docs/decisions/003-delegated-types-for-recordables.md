---
id: "003"
title: Delegated Types for Recordables
status: accepted
date: 2026-01-31
depends_on: "004"
---

## Context

We're adding Quick Notes—day-level observations not tied to a specific subject. Currently, Narrations are subject-attached learning evidence. Both share common traits:

| Feature         | Attached To    | Purpose                          |
| --------------- | -------------- | -------------------------------- |
| **Narrations**  | Subject + Date | Learning evidence for curriculum |
| **Quick Notes** | Date only      | Day-level observations           |

The original plan (006-quick-notes-epic.md) proposed a separate `QuickNote` model with `week_id` + `day_index`. However:

1. No `Week` model exists in the codebase
2. Existing data uses `date` directly (Narrations, Completions)
3. A unified timeline view is a key feature requirement

The 37signals article ["The Rails Delegated Type Pattern"](https://dev.37signals.com/the-rails-delegated-type-pattern/) describes how Basecamp uses this pattern for their "recordables" system—messages, documents, uploads, comments all unified under a single `Recording` superclass.

## Options Considered

### Option A: Separate Models (Original Plan)

Create `QuickNote` as a standalone model, merge results in Ruby for timeline display.

**Pros:**

- Simpler initial implementation
- No migration of existing data

**Cons:**

- Manual merging for timeline (ordering ties, pagination)
- Duplicated authorization logic
- Harder to add new recordable types later

### Option B: Single Table Inheritance (STI)

Use one table with a `type` column for all recordables.

**Pros:**

- Single table queries
- Built-in Rails pattern

**Cons:**

- Mega table with all columns from all types
- Narration has `subject_id`, `narration_type`, media; QuickNote has only `content`
- Schema grows unwieldy as types diverge

### Option C: Delegated Types (Proposed)

Use Rails' `delegated_type` with a `Recording` superclass table storing shared metadata, delegating to type-specific tables.

**Pros:**

- Single `recordings` table for timeline queries (sort, paginate, filter)
- Each type keeps only its specific columns
- Easy to add new types without schema changes to `recordings`
- Consistent ownership and authorization
- Well-documented pattern used at scale (Basecamp, HEY)

**Cons:**

- More complex than Option A
- Requires backfill migration for existing Narrations
- Learning curve for the pattern

## Decision

**Adopt Delegated Types (Option C).**

### Rationale

1. **Unified Timeline**: The `/notes` view needs to display both Narrations and Quick Notes in a single, paginated feed. `delegated_type` makes this trivial: `Recording.includes(:recordable).recent`

2. **Future Extensibility**: Adding new recordable types (e.g., "Photo", "Link", "Outcome") requires only a new table and model—no changes to `recordings`

3. **Separation of Concerns**: Each type keeps its specific validations and attachments. Narration has complex rules (media required for voice/photo); QuickNote is always text-only

4. **Proven at Scale**: 37signals uses this pattern for Basecamp's entire content system. For our 3-user app, this is more than sufficient

## Data Model

### Recording (Superclass)

Stores shared timeline metadata:

```ruby
# db/migrate/xxx_create_recordings.rb
create_table :recordings do |t|
  t.references :student, null: false, foreign_key: true
  t.date :date, null: false
  t.string :recordable_type, null: false
  t.bigint :recordable_id, null: false
  t.timestamps
end

add_index :recordings, [:student_id, :date]
add_index :recordings, [:recordable_type, :recordable_id], unique: true
```

```ruby
# app/models/recording.rb
class Recording < ApplicationRecord
  belongs_to :student

  delegated_type :recordable, types: %w[Narration QuickNote], dependent: :destroy

  validates :date, presence: true

  scope :recent, -> { order(date: :desc, created_at: :desc) }
  scope :for_date, ->(date) { where(date: date) }
end
```

### QuickNote (Delegatee)

New model for day-level observations:

```ruby
# db/migrate/xxx_create_quick_notes.rb
create_table :quick_notes do |t|
  t.text :content, null: false
  t.timestamps
end
```

```ruby
# app/models/quick_note.rb
class QuickNote < ApplicationRecord
  has_one :recording, as: :recordable, dependent: :destroy, inverse_of: :recordable
  delegate :student, :student_id, :date, to: :recording

  validates :content, presence: true
end
```

### Narration (Refactored Delegatee)

Existing model adapted to work with Recording. Note: The `student_matches_subject` validation
must handle both individual subjects (owned by Student via Teachable) and group subjects
(owned by StudentGroup via Teachable). See ADR 004 for the Teachable pattern.

```ruby
# app/models/narration.rb
class Narration < ApplicationRecord
  belongs_to :subject
  has_one_attached :media

  has_one :recording, as: :recordable, dependent: :destroy, inverse_of: :recordable
  delegate :student, :student_id, :date, to: :recording

  validates :narration_type, presence: true, inclusion: { in: %w[text voice photo] }
  validates :content, presence: true, if: :text?
  validates :media, presence: true, if: -> { voice? || photo? }

  validate :student_matches_subject

  enum :narration_type, { text: "text", voice: "voice", photo: "photo" }

  private

  # Validates that the recording's student is allowed to narrate this subject.
  # - For individual subjects: student must match the subject's owner
  # - For group subjects: student must be a member of the group
  def student_matches_subject
    return unless subject.present? && recording&.student.present?

    teachable = subject.teachable
    student = recording.student

    if teachable.student?
      # Individual subject: student must match
      unless teachable.student == student
        errors.add(:subject, "must belong to the same student")
      end
    elsif teachable.student_group?
      # Group subject: student must be a member of the group
      unless teachable.student_group.students.include?(student)
        errors.add(:subject, "student must be a member of the group")
      end
    end
  end
end
```

### Student (Updated)

Note: Per ADR 004, Student is a delegatee of Teachable. The `user` and `name` are
accessed via delegation from Teachable, and subjects belong to Teachable (not Student).

```ruby
# app/models/student.rb
class Student < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  delegate :name, :user, to: :teachable

  has_many :recordings, dependent: :destroy
  has_many :group_memberships, dependent: :destroy
  has_many :student_groups, through: :group_memberships

  # Get all subjects for this student (individual + groups they belong to)
  def all_subjects
    teachable_ids = [teachable.id] + student_groups.map { |g| g.teachable.id }
    Subject.where(teachable_id: teachable_ids)
  end
end
```

## Migration Strategy

No production data exists, so we can do a clean migration without backfill:

1. Drop existing `narrations` table
2. Create `recordings` table (superclass)
3. Create new `narrations` table (delegatee, without `student_id`/`date`)
4. Create `quick_notes` table (delegatee)
5. Update models and tests

## Timeline Query

```ruby
# Unified feed
@recordings = current_student.recordings.includes(:recordable).recent

# Render with partials
<%= render partial: "recordings/#{recording.recordable_type.underscore}",
           locals: { recording: recording, recordable: recording.recordable } %>
```

## Interaction with ADR 004 (Teachable)

This ADR depends on ADR 004 (Teachable Delegated Type). Key interactions:

| This ADR (Recording)         | ADR 004 (Teachable)                     |
| ---------------------------- | --------------------------------------- |
| Recording belongs to Student | No change - artifacts are individual    |
| Narration belongs to Subject | Subject now belongs to Teachable        |
| Validation checks ownership  | Must handle Student OR StudentGroup     |

### Group Subject Narrations

When a student creates a narration for a group subject (e.g., "Family Study: Picture Study"):

1. Recording belongs to the individual student (Najmi)
2. Narration references the subject
3. Subject belongs to StudentGroup via Teachable
4. Validation confirms Najmi is a member of the group

This allows each student to create their own narration (artifact) for group learning activities.

## Consequences

### Positive

- Single query for unified timeline with correct ordering
- Each recordable type has clean, focused schema
- Adding new types is trivial (new table + model)
- Consistent authorization through Recording → Student
- Follows proven pattern from 37signals

### Negative

- Slightly more complex than two separate models
- N+1 risk with attachments (acceptable for 3 users)

### Risks and Mitigations

| Risk                         | Mitigation                                          |
| ---------------------------- | --------------------------------------------------- |
| N+1 on media attachments     | Acceptable at scale; optimize later if needed       |
| Team unfamiliar with pattern | Document with examples; link to 37signals resources |

## What Changes from Original Plan

| Original Plan (006)             | New Approach                            |
| ------------------------------- | --------------------------------------- |
| `week_id` + `day_index`         | `date` directly (matches existing data) |
| Standalone `QuickNote` model    | QuickNote as delegatee of Recording     |
| Separate queries, merge in Ruby | Single `Recording` query                |

## Implementation Guidance

### Avoiding N+1 Queries

When loading the unified timeline, always eager load the recordable and its associations:

```ruby
# Good: Eager loads recordables
@recordings = current_student.recordings.includes(:recordable).recent

# Better: Also eager load attachments for voice/photo narrations
@recordings = current_student.recordings
  .includes(recordable: { media_attachment: :blob })
  .recent
```

### Creation Pattern

QuickNotes should be created with their Recording in a transaction:

```ruby
# In QuickNotesController
def create
  Recording.transaction do
    @quick_note = QuickNote.create!(quick_note_params)
    @recording = Recording.create!(
      student: current_student,
      date: Date.current,
      recordable: @quick_note
    )
  end
end
```

Alternatively, use `accepts_nested_attributes_for`:

```ruby
# app/models/quick_note.rb
class QuickNote < ApplicationRecord
  has_one :recording, as: :recordable, dependent: :destroy, inverse_of: :recordable
  accepts_nested_attributes_for :recording
end

# Controller
@quick_note = QuickNote.create!(
  content: params[:content],
  recording_attributes: { student: current_student, date: Date.current }
)
```

### Test Fixtures Example

```yaml
# test/fixtures/users.yml
vika:
  email: vika@example.com
  role: parent

# test/fixtures/recordings.yml
najmi_math_narration:
  student: najmi
  date: <%= Date.new(2026, 1, 28) %>
  recordable_type: Narration
  recordable_id: <%= ActiveRecord::FixtureSet.identify(:najmi_text_narration) %>

najmi_quick_note:
  student: najmi
  date: <%= Date.new(2026, 1, 28) %>
  recordable_type: QuickNote
  recordable_id: <%= ActiveRecord::FixtureSet.identify(:field_trip_note) %>

isa_math_narration:
  student: isa
  date: <%= Date.new(2026, 1, 28) %>
  recordable_type: Narration
  recordable_id: <%= ActiveRecord::FixtureSet.identify(:isa_text_narration) %>

# test/fixtures/narrations.yml
najmi_text_narration:
  subject: najmi_math
  narration_type: text
  content: "Today I learned about fractions"

isa_text_narration:
  subject: isa_math
  narration_type: text
  content: "I practiced addition and subtraction"

# test/fixtures/quick_notes.yml
field_trip_note:
  content: "Field trip to the museum today - shortened lessons"
```

## References

- [The Rails Delegated Type Pattern](https://dev.37signals.com/the-rails-delegated-type-pattern/) - 37signals
- [Rails API: ActiveRecord::DelegatedType](https://api.rubyonrails.org/classes/ActiveRecord/DelegatedType.html)
- Plan 006: Quick Notes Epic
- ADR 004: Teachable Delegated Type
