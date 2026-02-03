---
id: "004"
title: Teachable Delegated Type for Students and Groups
status: accepted
date: 2026-01-31
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

## Options Considered

### Option A: Polymorphic Association

Use `belongs_to :owner, polymorphic: true` on Subject directly:

```ruby
class Subject < ApplicationRecord
  belongs_to :owner, polymorphic: true  # Student or StudentGroup
end
```

**Pros:**
- Simpler, fewer tables
- Well-understood Rails pattern

**Cons:**
- No unified query for "all teachables" without manual UNION
- User ownership scattered across types (each needs `belongs_to :user`)
- Less structured than delegated_type

### Option B: Duplicate Subjects Per Student

For group subjects, create a copy for each student:

```ruby
# "Family Study: Picture Study" becomes:
# - Subject for Najmi (copy)
# - Subject for Isa (copy)
```

**Pros:**
- Keeps simple Student → Subject relationship
- No group_membership complexity

**Cons:**
- Data duplication
- Sync issues if subject is renamed
- Completion tracking becomes complex (mark all copies? or one authoritative?)

### Option C: Delegated Types (Chosen)

Use `delegated_type` with Teachable as superclass.

**Why this option:**
1. Unified `Teachable.for_user(user)` query for all things that can be taught
2. Centralized user ownership in Teachable (no duplication)
3. Clean separation: group subjects exist once, members share via group_memberships
4. Extensible: could add "ClassGroup" or "Cohort" later

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

### Authorization Rules

Completions have different authorization depending on subject ownership:

| Subject Type | Who Can Mark Complete | Rationale |
| ------------ | --------------------- | --------- |
| **Individual** (Student) | Parent OR Student | Child can check off their own work |
| **Group** (StudentGroup) | Parent only | Teacher coordinates group activities |

Narrations (artifacts) always belong to the individual student who created them:

| Subject Type | Who Can Narrate | Validation |
| ------------ | --------------- | ---------- |
| **Individual** | The owning student | `teachable.student == recording.student` |
| **Group** | Any group member | `teachable.student_group.students.include?(recording.student)` |

### View Compatibility Helpers

To ease the transition from `subject.student` pattern, add helper methods to Subject:

```ruby
# app/models/subject.rb
class Subject < ApplicationRecord
  belongs_to :teachable

  # Helper for views that need a student for path generation
  # For individual subjects: returns the owner
  # For group subjects: returns the provided fallback (current_student)
  def student_for_narration(current_student)
    teachable.student? ? teachable.student : current_student
  end

  # Check if this subject is accessible by a given student
  def for_student?(student)
    if teachable.student?
      teachable.student == student
    else
      teachable.student_group.students.include?(student)
    end
  end

  # Returns the student if individual subject, nil if group
  def owner_student
    teachable.student? ? teachable.student : nil
  end
end
```

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

This ADR must be implemented **before** ADR 003 (Recording pattern). ADR 003 depends on the
Teachable infrastructure established here.

| This ADR (Teachable)         | ADR 003 (Recording)                        |
| ---------------------------- | ------------------------------------------ |
| Subject belongs to Teachable | Narration.student_matches_subject uses it  |
| Student is a delegatee       | Recording still belongs to Student         |
| StudentGroup has members     | Validation checks group membership         |

The Recording pattern works unchanged; we're just clarifying that Subject's owner (Teachable) can be a group.

## Migration Strategy

Since no production data exists:

1. Create `teachables`, `student_groups`, `group_memberships` tables
2. Refactor `students` table (remove user_id, name)
3. Create Teachable records for existing students
4. Update `subjects` to reference `teachable_id` instead of `student_id`
5. Update all models and tests

## Implementation Guidance

### Avoiding N+1 on all_subjects

When loading a student's subjects, eager load group memberships:

```ruby
# In controller
@student = Student.includes(:teachable, student_groups: :teachable).find(id)
@subjects = @student.all_subjects.includes(:subject_options)

# Optimized all_subjects with eager loading
def all_subjects
  Subject.includes(:teachable).where(teachable_id: all_teachable_ids)
end

private

def all_teachable_ids
  [teachable_id] + student_groups.map { |g| g.teachable_id }
end
```

### Same Subject, Different Context

**Important clarification**: When the same activity is sometimes individual and sometimes group (e.g., "Math might be 1:1 some days, group other days"), create **separate Subject records**:

```ruby
# Individual Math for Najmi
Subject.create!(teachable: najmi.teachable, name: "Math", subject_type: :fixed)

# Family Math Review (group activity)
Subject.create!(teachable: family_group.teachable, name: "Math Review", subject_type: :scheduled)
```

The ownership of a Subject is **fixed at creation time**. Scheduling variations are modeled through:
1. `subject_type: :scheduled` with `scheduled_days`
2. Separate subjects for different contexts

This matches the paper planner model where "Najmi's Math" and "Family Study: Math Review" are distinct rows.

### Test Fixtures

```yaml
# test/fixtures/users.yml
vika:
  email: vika@example.com
  role: parent

# test/fixtures/teachables.yml
najmi_teachable:
  user: vika
  name: Najmi
  teachable_type: Student
  teachable_id: <%= ActiveRecord::FixtureSet.identify(:najmi) %>

isa_teachable:
  user: vika
  name: Isa
  teachable_type: Student
  teachable_id: <%= ActiveRecord::FixtureSet.identify(:isa) %>

family_teachable:
  user: vika
  name: Family Study
  teachable_type: StudentGroup
  teachable_id: <%= ActiveRecord::FixtureSet.identify(:family_group) %>

najmi_isa_joint:
  user: vika
  name: Najmi & Isa Tutoring
  teachable_type: StudentGroup
  teachable_id: <%= ActiveRecord::FixtureSet.identify(:joint_group) %>

# test/fixtures/students.yml
najmi:
  avatar_url: null
  year_level: 6  # Age 11

isa:
  avatar_url: null
  year_level: 3  # Age 8

# test/fixtures/student_groups.yml
family_group:
  group_type: family

joint_group:
  group_type: joint

# test/fixtures/group_memberships.yml
najmi_in_family:
  student: najmi
  student_group: family_group

isa_in_family:
  student: isa
  student_group: family_group

najmi_in_joint:
  student: najmi
  student_group: joint_group

isa_in_joint:
  student: isa
  student_group: joint_group

# test/fixtures/subjects.yml
najmi_math:
  teachable: najmi_teachable
  name: Math
  subject_type: fixed

isa_math:
  teachable: isa_teachable
  name: Math
  subject_type: fixed

family_picture_study:
  teachable: family_teachable
  name: Picture Study
  subject_type: scheduled
```

## Open Questions

### Weekly Totals Scope

**Question:** When displaying weekly completion totals, should they be teachable-scoped or student-scoped?

**Current Implementation (Teachable-scoped):**
```ruby
# CompletionsController#calculate_week_totals
subjects = Subject.where(teachable: @subject.teachable)
week_completions = Completion.joins(:subject)
                             .where(subjects: { teachable_id: @subject.teachable_id })
                             .where(date: week_start..week_end)
                             .count
```

**Behavior:**
- When viewing a **personal subject** → weekly totals show only personal subjects
- When viewing a **group subject** → weekly totals show only group subjects (excludes personal ones)

**Alternative (Student-scoped):**
```ruby
# Show ALL subjects accessible to the student (personal + groups)
subjects = current_student.all_subjects
week_completions = Completion.joins(:subject)
                             .where(subjects: { teachable_id: subjects.map(&:teachable_id) })
                             .where(date: week_start..week_end)
                             .count
```

**Trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| **Teachable-scoped** (current) | Clean separation between personal vs group work | Student can't see total progress across all contexts |
| **Student-scoped** | Student sees complete picture of their week | Harder to distinguish group vs personal progress |

**Decision needed:** Which behavior aligns better with the paper planner model and parent workflow?

**Tracked in:** `hs-teach-review.11`

## References

- [The Rails Delegated Type Pattern](https://dev.37signals.com/the-rails-delegated-type-pattern/) - 37signals
- [Rails API: ActiveRecord::DelegatedType](https://api.rubyonrails.org/classes/ActiveRecord/DelegatedType.html)
- ADR 003: Delegated Types for Recordables
- Family Studies and Tutoring Schedule.pdf
