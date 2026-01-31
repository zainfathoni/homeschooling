---
id: "004"
title: Teachable Delegated Type for Students and Groups
status: proposed
date: 2026-01-31
depends_on: "003"
---

## Context

The homeschool planner tracks learning for multiple contexts:

| Context            | Code     | Participants          | Examples                                     |
| ------------------ | -------- | --------------------- | -------------------------------------------- |
| **Individual**     | (N), (I) | Single student        | Math, Daily Report                           |
| **Family Study**   | (F)      | All children together | Picture Study, Nature Study, 99 Names of God |
| **Joint Tutoring** | (N&I)    | Specific subset       | Foreign Language, Map Drilling               |

Key observations from the Family Studies and Tutoring Schedule:

1. **Same subject can be individual or group** - Tutoring mode depends on teacher availability; Math might be 1:1 some days, group other days
2. **Group subjects produce individual artifacts** - Family Study on Picture Study yields different narrations/handicrafts per student
3. **Pick1 subjects need balance tracking** - Teacher wants to see which books have been used to avoid over/under coverage

## Decision

**Adopt Teachable as a delegated_type superclass** for both Student and StudentGroup.

### Data Model

```txt
┌─────────────────────────────────────────────────────────┐
│                      Teachable                          │
│  (superclass: user_id, name, teachable_type/id)         │
└─────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│      Student        │      │     StudentGroup        │
│  (avatar, year)     │◄────►│  (group_type: family    │
│                     │      │   or joint)             │
└─────────────────────┘      └─────────────────────────┘
          │ group_memberships      │
          └────────────────────────┘

Teachable has_many :subjects
Teachable has_many :completions (via subjects)
Student has_many :recordings (artifacts always individual)
```

### Migration

```ruby
# db/migrate/xxx_create_teachables.rb
create_table :teachables do |t|
  t.references :user, null: false, foreign_key: true
  t.string :name, null: false
  t.string :teachable_type, null: false
  t.bigint :teachable_id, null: false
  t.timestamps
end

add_index :teachables, [:user_id]
add_index :teachables, [:teachable_type, :teachable_id], unique: true
```

```ruby
# db/migrate/xxx_create_student_groups.rb
create_table :student_groups do |t|
  t.string :group_type, null: false, default: "family"
  t.timestamps
end

# group_type: "family" (all children) or "joint" (specific subset)
```

```ruby
# db/migrate/xxx_create_group_memberships.rb
create_table :group_memberships do |t|
  t.references :student, null: false, foreign_key: true
  t.references :student_group, null: false, foreign_key: true
  t.timestamps
end

add_index :group_memberships, [:student_id, :student_group_id], unique: true
```

```ruby
# db/migrate/xxx_refactor_students.rb
# Remove user_id, name from students (moved to teachables)
# Keep only student-specific: avatar_url, year_level
```

```ruby
# db/migrate/xxx_refactor_subjects.rb
# Change belongs_to :student → belongs_to :teachable
```

### Models

```ruby
# app/models/teachable.rb
class Teachable < ApplicationRecord
  belongs_to :user

  delegated_type :teachable, types: %w[Student StudentGroup], dependent: :destroy

  has_many :subjects, dependent: :destroy

  validates :name, presence: true

  scope :for_user, ->(user) { where(user: user) }
end
```

```ruby
# app/models/student.rb
class Student < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  delegate :name, :user, :subjects, to: :teachable

  has_many :group_memberships, dependent: :destroy
  has_many :student_groups, through: :group_memberships
  has_many :recordings, dependent: :destroy

  # Get all subjects for this student (individual + groups they belong to)
  def all_subjects
    teachable_ids = [teachable.id] + student_groups.map { |g| g.teachable.id }
    Subject.where(teachable_id: teachable_ids)
  end
end
```

```ruby
# app/models/student_group.rb
class StudentGroup < ApplicationRecord
  has_one :teachable, as: :teachable, dependent: :destroy
  delegate :name, :user, :subjects, to: :teachable

  has_many :group_memberships, dependent: :destroy
  has_many :students, through: :group_memberships

  enum :group_type, { family: "family", joint: "joint" }
end
```

```ruby
# app/models/subject.rb
class Subject < ApplicationRecord
  belongs_to :teachable  # Can be Student or StudentGroup

  has_many :completions, dependent: :destroy
  has_many :subject_options, -> { order(:position) }, dependent: :destroy
  has_many :narrations, dependent: :destroy

  # Delegate to get the actual student or group
  delegate :student?, :student_group?, to: :teachable, prefix: true
end
```

```ruby
# app/models/completion.rb
class Completion < ApplicationRecord
  belongs_to :subject
  belongs_to :subject_option, optional: true

  delegate :teachable, to: :subject

  validates :date, presence: true

  scope :for_date, ->(date) { where(date: date) }
end
```

### Key Relationships

| Entity         | Belongs To       | Reasoning                          |
| -------------- | ---------------- | ---------------------------------- |
| **Teachable**  | User             | Ownership container                |
| **Subject**    | Teachable        | Can be individual or group subject |
| **Completion** | Subject          | Tracks if teachable completed it   |
| **Recording**  | Student (always) | Artifacts are always individual    |
| **Narration**  | Subject          | Can reference group subject        |

### Example: Family Study Flow

```txt
Family Study: Picture Study
├── Subject belongs to "Family" (StudentGroup via Teachable)
├── Completion: Family completed Picture Study on Jan 31 ✓
├── Recording: Najmi → Narration about Picture Study (his drawing)
└── Recording: Isa → Narration about Picture Study (his drawing)
```

### Pick1 Balance Query

```ruby
# Show which books Family has used for Islamic Study this term
family_islamic_study.completions
  .where(date: term_start..term_end)
  .joins(:subject_option)
  .group("subject_options.name")
  .count

# => { "Safar Book" => 8, "Quran Stories" => 2, "Hadith" => 0 }
# Teacher sees imbalance → consciously picks Hadith next time
```

### Unified Queries

```ruby
# All teachables for current user (students + groups)
current_user.teachables
# => [Najmi (Student), Isa (Student), Family (StudentGroup), Najmi+Isa (StudentGroup)]

# All subjects Najmi needs to complete today
najmi.all_subjects.select { |s| s.active_on?(Date.current) }

# Unified timeline via Recording (per ADR 003)
najmi.recordings.includes(:recordable).recent
```

## Consequences

### Positive

- Unified query for all "teachables" (individuals + groups)
- Subjects can belong to individuals or groups naturally
- Completions track group completion with one record
- Artifacts (recordings) remain per-student
- Pick1 balance tracking works at any level
- Extensible: add new teachable types without schema changes

### Negative

- More complex than simple Student model
- Querying "all subjects for a student" requires union across individual + group memberships
- Migration requires restructuring existing data

### Interaction with ADR 003

This ADR extends ADR 003:

| ADR 003 (Recording)          | ADR 004 (Teachable)                  |
| ---------------------------- | ------------------------------------ |
| Recording belongs to Student | No change - artifacts are individual |
| Narration belongs to Subject | Subject now belongs to Teachable     |
| Student has_many :recordings | Student accessed via Teachable       |

The Recording pattern works unchanged; we're just clarifying that Subject's owner (Teachable) can be a group.

## Migration Strategy

Since no production data exists:

1. Create `teachables`, `student_groups`, `group_memberships` tables
2. Refactor `students` table (remove user_id, name)
3. Create Teachable records for existing students
4. Update `subjects` to reference `teachable_id` instead of `student_id`
5. Update all models and tests

## References

- [The Rails Delegated Type Pattern](https://dev.37signals.com/the-rails-delegated-type-pattern/) - 37signals
- [Rails API: ActiveRecord::DelegatedType](https://api.rubyonrails.org/classes/ActiveRecord/DelegatedType.html)
- ADR 003: Delegated Types for Recordables
- Family Studies and Tutoring Schedule.pdf
