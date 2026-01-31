---
id: "007"
title: Teachable Foundation Epic
status: planning
created: 2026-01-31
decision: "004"
---

## Overview

Implement the Teachable delegated_type pattern per [ADR 004](../decisions/004-teachable-delegated-type.md). This is a foundational refactoring that must be completed before ADR 003 (Recording pattern) can be implemented.

## Goal

- Create Teachable superclass with delegated_type to Student and StudentGroup
- Refactor Student to be a delegatee (move user_id, name to Teachable)
- Create StudentGroup for Family Study and Joint Tutoring
- Create group_memberships join table
- Update Subject to belong to Teachable instead of Student
- Update all dependent code and tests

## Data Model

```
┌─────────────────────────────────────────────────────────┐
│                      Teachable                          │
│  (user_id, name, teachable_type, teachable_id)          │
└─────────────────────────────────────────────────────────┘
          │                              │
          ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│      Student        │      │     StudentGroup        │
│  (avatar_url,       │◄────►│  (group_type: family    │
│   year_level)       │      │   or joint)             │
└─────────────────────┘      └─────────────────────────┘
          │ group_memberships      │
          └────────────────────────┘
```

## Task Breakdown

### Task 1: Create Teachable & StudentGroup tables (hs-teach.1)

- Create `teachables` table with user_id, name, teachable_type, teachable_id
- Create `student_groups` table with group_type
- Create `group_memberships` join table
- Add indexes and foreign keys

### Task 2: Create Teachable model (hs-teach.2)

- Create Teachable model with delegated_type
- Add validations and scopes
- Unit tests

### Task 3: Create StudentGroup model (hs-teach.3)

- Create StudentGroup model with group_type enum
- Add has_one :teachable association
- Add group_memberships associations
- Unit tests

### Task 4: Refactor Student model (hs-teach.4)

- Remove user_id from students table (moved to teachables)
- Add has_one :teachable association
- Add delegate methods for name, user
- Add all_subjects helper method
- Update existing tests

### Task 5: Refactor Subject model (hs-teach.5)

- Change belongs_to :student → belongs_to :teachable
- Update dependent code (completions, narrations)
- Update existing tests

### Task 6: Data migration (hs-teach.6)

- Create Teachable records for existing students
- Update subjects to reference teachable_id
- Verify data integrity

### Task 7: Integration tests (hs-teach.7)

- Test Student + Teachable workflow
- Test StudentGroup + Teachable workflow
- Test Subject belonging to group
- Test all_subjects query

## Dependencies

```txt
hs-teach.1 ─► hs-teach.2 ─► hs-teach.3 ─► hs-teach.4 ─► hs-teach.5 ─► hs-teach.6 ─► hs-teach.7
```

## Issue Hierarchy

```txt
hs-teach (EPIC)
├── hs-teach.1: Create Teachable & StudentGroup tables
├── hs-teach.2: Create Teachable model
├── hs-teach.3: Create StudentGroup model
├── hs-teach.4: Refactor Student model
├── hs-teach.5: Refactor Subject model
├── hs-teach.6: Data migration
└── hs-teach.7: Integration tests
```

## Verification

After implementation:

1. `bin/rails test` - all tests pass
2. `Student.first.teachable` returns Teachable record
3. `Teachable.first.student` returns Student record
4. `Subject.first.teachable` returns Teachable (Student or StudentGroup)
5. `student.all_subjects` returns individual + group subjects
6. Can create StudentGroup with members

## Blocks

This epic must be completed before:
- Plan 006: Quick Notes Epic (hs-qn)
- ADR 003: Recording pattern implementation

## References

- [ADR 004: Teachable Delegated Type](../decisions/004-teachable-delegated-type.md)
- [Family Studies and Tutoring Schedule.pdf](../examples/Family%20Studies%20and%20Tutoring%20Schedule.pdf)
