---
id: "006"
title: Quick Notes Epic
status: planning
created: 2026-01-31
depends_on: "007"
decision: "003"
---

## Overview

Quick Notes are date-level observations distinct from subject-attached Narrations. They capture day-level context like "Field trip today", "Shortened lessons - dentist", or general reflections not tied to a specific subject.

**Prerequisite**: This plan depends on [Plan 007 (Teachable Foundation)](007-teachable-foundation-epic.md) being implemented first. The Narration validation and Student model assume the Teachable delegated_type pattern is in place.

## Key Distinction

| Feature         | Attached To    | Purpose                          | Examples                          |
| --------------- | -------------- | -------------------------------- | --------------------------------- |
| **Narrations**  | Subject + Date | Learning evidence for curriculum | "Tell me about the book you read" |
| **Quick Notes** | Date only      | Day-level observations           | "We visited the museum today"     |

## Goal

- Implement delegated_type pattern per ADR 003
- Recording superclass for unified timeline queries
- QuickNote and Narration as delegatees
- Quick capture UI: FAB on mobile, section on tablet
- Text-only for v1 (voice deferred)

## Data Model

Per [ADR 003](../decisions/003-delegated-types-for-recordables.md), we use Rails `delegated_type` pattern.

### Recording (Superclass)

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

```ruby
# db/migrate/xxx_recreate_narrations.rb
# Drop existing narrations table and recreate without student_id/date
create_table :narrations do |t|
  t.references :subject, null: false, foreign_key: true
  t.string :narration_type, null: false
  t.text :content
  t.timestamps
end
```

Note: The `student_matches_subject` validation must handle both individual subjects
(owned by Student via Teachable) and group subjects (owned by StudentGroup via Teachable).
See ADR 004 for the Teachable pattern.

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
      unless teachable.student == student
        errors.add(:subject, "must belong to the same student")
      end
    elsif teachable.student_group?
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

## UI Components

### Mobile: Quick Notes FAB

- Fixed bottom-right button (above bottom nav)
- Opens modal with textarea
- No subject selector (key difference from old implementation)
- Posts to `quick_notes_path`

### Tablet: Quick Notes Section

- Card in Duet view daily focus panel
- Inline form, no modal needed
- Shows existing notes for the day

### Notes Timeline

- Quick Notes appear in `/notes` view alongside Narrations
- Distinct styling (no subject badge)
- Filterable by type

## Task Breakdown

### Task 1: Delegated Types Foundation (hs-qn.1)

- Create `recordings` table (superclass)
- Drop existing `narrations` table, recreate as delegatee (without student_id/date)
- Create `quick_notes` table (delegatee)
- Create Recording model with delegated_type
- Refactor Narration model to use Recording
- Create QuickNote model
- Update Student associations
- Unit tests for all three models

### Task 2: QuickNotes Controller (hs-qn.2)

- CRUD actions for QuickNote via Recording
- Scoped to current student
- Turbo Stream responses

### Task 3: Quick Notes FAB (Mobile) (hs-qn.3)

- Stimulus controller for modal
- Form partial
- Integration with daily view

### Task 4: Quick Notes Section (Tablet) (hs-qn.4)

- Inline form partial
- Display existing notes
- Integration with Duet view

### Task 5: Notes Timeline Integration (hs-qn.5)

- Build `/notes` view using `Recording.includes(:recordable).recent`
- Render partials per recordable type
- Filter by type (Narrations vs Quick Notes)

### Task 6: Integration Tests (hs-qn.6)

- Controller tests for recordings
- Integration tests for both breakpoints
- Timeline display tests

## Dependencies

```txt
hs-qn.1 ─► hs-qn.2 ─┬─► hs-qn.3 ─► hs-qn.6
                    └─► hs-qn.4 ─► hs-qn.5 ─► hs-qn.6
```

## Issue Hierarchy

```txt
hs-qn (EPIC)
├── hs-qn.1: Delegated types foundation (Recording + QuickNote + Narration refactor)
├── hs-qn.2: QuickNotes controller
├── hs-qn.3: Quick Notes FAB (mobile)
├── hs-qn.4: Quick Notes section (tablet)
├── hs-qn.5: Notes timeline integration
└── hs-qn.6: Integration tests
```

## Timeline Query Example

```ruby
# Unified feed - single query with correct ordering
@recordings = current_student.recordings.includes(:recordable).recent

# Render with partials
<%= render partial: "recordings/#{recording.recordable_type.underscore}",
           locals: { recording: recording, recordable: recording.recordable } %>
```

## Verification

After implementation:

1. `bin/rails test` - all tests pass
2. Mobile: FAB visible, modal opens, can save note without selecting subject
3. Tablet: Section visible in Duet view, inline form works
4. Notes view: Quick Notes and Narrations in unified timeline via Recording
5. Data: Recording holds student_id + date; QuickNote has only content; Narration has subject_id + type
