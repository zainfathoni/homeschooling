# Architecture Overview

This document describes the core architectural patterns used in the Homeschool Planner application.

## Teachable Pattern

The application uses Rails' `delegated_type` pattern to model entities that can be taught—either individual students or groups of students.

### Why Delegated Type?

1. **Unified queries**: `Teachable.for_user(user)` returns all students and groups in one query
2. **Centralized ownership**: User relationship lives in Teachable, not duplicated across types
3. **Clean subject ownership**: Subjects belong to Teachable, naturally supporting both individual and group subjects
4. **Extensibility**: New teachable types (e.g., "Cohort") can be added without schema changes

For detailed rationale and alternatives considered, see [ADR-004](decisions/004-teachable-delegated-type.md).

### Data Model

```txt
┌─────────────────────────────────────────────────────────────────┐
│                            User                                 │
│                    (parent/teacher account)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ has_many
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Teachable                               │
│            (user_id, name, teachable_type, teachable_id)        │
│                                                                 │
│  delegated_type → Student | StudentGroup                        │
│  has_many :subjects                                             │
└─────────────────────────────────────────────────────────────────┘
           │                                    │
           │ Student                            │ StudentGroup
           ▼                                    ▼
┌─────────────────────┐              ┌─────────────────────────┐
│      Student        │◄────────────►│     StudentGroup        │
│                     │ group_       │  (group_type: family    │
│ has_many :narrations│ memberships  │   or joint)             │
└─────────────────────┘              └─────────────────────────┘
           │                                    │
           │                                    │
           ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Subject                                │
│  belongs_to :teachable (individual OR group subject)            │
│  has_many :completions, :narrations, :subject_options           │
└─────────────────────────────────────────────────────────────────┘
```

### Core Relationships

| Model          | Relationship                                            | Notes                                |
| -------------- | ------------------------------------------------------- | ------------------------------------ |
| `Teachable`    | `belongs_to :user`                                      | Ownership container                  |
| `Teachable`    | `delegated_type :teachable`                             | Delegates to Student or StudentGroup |
| `Student`      | `has_one :teachable`                                    | Receives name/user via delegation    |
| `Student`      | `has_many :student_groups, through: :group_memberships` | Group membership                     |
| `StudentGroup` | `has_one :teachable`                                    | Receives name/user via delegation    |
| `StudentGroup` | `has_many :students, through: :group_memberships`       | Members                              |
| `Subject`      | `belongs_to :teachable`                                 | Can be individual or group subject   |

## Usage Examples

### Creating a Student

```ruby
# Student delegates :name, :user, :user_id to :teachable
student = Student.create!(
  teachable: Teachable.new(user: current_user, name: "Najmi")
)

student.name     # => "Najmi" (delegated)
student.user     # => current_user (delegated)
```

### Creating a Student Group

```ruby
# Family group with all children
family = StudentGroup.create!(
  group_type: :family,
  teachable: Teachable.new(user: current_user, name: "Family Study")
)

# Add members
family.students << najmi
family.students << isa
```

### Creating Subjects

```ruby
# Individual subject (belongs to student's teachable)
Subject.create!(
  teachable: najmi.teachable,
  name: "Math",
  subject_type: :fixed
)

# Group subject (belongs to group's teachable)
Subject.create!(
  teachable: family.teachable,
  name: "Picture Study",
  subject_type: :scheduled,
  scheduled_days: [0, 2, 4]  # Mon, Wed, Fri
)
```

### Querying a Student's Subjects

```ruby
# All subjects for a student (individual + from groups)
najmi.all_subjects
# => Returns subjects from najmi.teachable + all group teachables

# Implementation uses all_teachable_ids for efficient querying
najmi.all_teachable_ids
# => [1, 3, 4] (own teachable + group teachables)
```

### Querying All Teachables for a User

```ruby
# Get all students and groups
Teachable.for_user(current_user)
# => [najmi.teachable, isa.teachable, family.teachable, ...]

# Filter by type
Teachable.students.for_user(current_user)
Teachable.student_groups.for_user(current_user)
```

## View Helper Methods

Subject provides helper methods for views that need to work with both individual and group subjects:

### `student_for_narration(current_student)`

Returns the appropriate student for creating narrations:

```ruby
# For individual subjects: returns the owning student
subject.student_for_narration(current_student)
# => subject.teachable.student

# For group subjects: returns the provided fallback
subject.student_for_narration(current_student)
# => current_student
```

**Use case**: Generating paths for narration forms where the student must be specified.

### `for_student?(student)`

Checks if a subject is accessible by a given student:

```ruby
# Individual subject - owned by student?
najmi_math.for_student?(najmi)  # => true
najmi_math.for_student?(isa)    # => false

# Group subject - student is member?
family_art.for_student?(najmi)  # => true (if najmi in group)
family_art.for_student?(isa)    # => true (if isa in group)
```

**Use case**: Authorization checks, filtering subjects in views.

### `owner_student`

Returns the owning student for individual subjects, nil for groups:

```ruby
najmi_math.owner_student   # => najmi (Student instance)
family_art.owner_student   # => nil
```

**Use case**: Conditional display logic based on subject ownership type.

### Checking Subject Type

Use the delegated type helpers:

```ruby
subject.teachable.student?        # => true if individual subject
subject.teachable.student_group?  # => true if group subject
```

## Group Types

StudentGroup supports two types via enum:

| Type     | Use Case              | Example                       |
| -------- | --------------------- | ----------------------------- |
| `family` | All children together | Family Study, Nature Walk     |
| `joint`  | Specific subset       | Najmi & Isa's Arabic tutoring |

```ruby
group = StudentGroup.new(group_type: :family)
group.family?  # => true
group.joint?   # => false
```

## Related Documentation

- [ADR-004: Teachable Delegated Type](decisions/004-teachable-delegated-type.md) - Full decision record with alternatives considered
- [ADR-003: Delegated Types for Recordables](decisions/003-delegated-types-for-recordables.md) - Recording pattern (depends on Teachable)
