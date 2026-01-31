# Multi-Perspective Evaluation: ADR-003 & ADR-004

**Date**: 2026-01-31
**Evaluator**: Claude
**Purpose**: Re-evaluate the proposed delegated_type patterns before implementation

---

## Executive Summary

Both ADRs propose using Rails' `delegated_type` pattern—a sophisticated solution pioneered by 37signals. This evaluation examines whether the complexity is justified for a 3-user homeschool app.

**Verdict**: ✅ **Proceed with both ADRs, with minor refinements**

The patterns are well-suited for the domain requirements, and the "no production data" situation makes this the ideal time to establish the right foundation.

---

## ADR-003: Delegated Types for Recordables (Recording → Narration/QuickNote)

### 1. Technical Perspective

| Criterion | Assessment | Notes |
|-----------|------------|-------|
| **Pattern Fit** | ✅ Strong | Unified timeline is a clear use case for delegated_type |
| **Complexity** | ⚠️ Medium | Adds one superclass table + mental model complexity |
| **Query Efficiency** | ✅ Good | Single `recordings` query vs. UNION or merge-in-Ruby |
| **Extensibility** | ✅ Excellent | Adding new recordable types is trivial |

**Concern**: The `has_one :recording` inverse on delegatees creates bidirectional dependency. Consider:
```ruby
# Current design (bidirectional)
class QuickNote < ApplicationRecord
  has_one :recording, as: :recordable, dependent: :destroy
end

# Alternative: Use accepts_nested_attributes for creation
class Recording < ApplicationRecord
  accepts_nested_attributes_for :recordable
end
```

**Recommendation**: Current design is acceptable. Bidirectional association is needed for delegation (`delegate :student, to: :recording`).

### 2. Domain Perspective

| Use Case | Without ADR-003 | With ADR-003 |
|----------|-----------------|--------------|
| Unified `/notes` timeline | Manual merge + sort | Single query |
| Filter by date | Two queries | One query |
| Add "Photo" type later | New model + view changes | New delegatee only |

**Domain fit is strong**. The distinction between "subject-attached narrations" and "day-level quick notes" is a real domain concept. Unifying them as "recordable artifacts" makes semantic sense.

### 3. User Experience Perspective

| Scenario | Impact |
|----------|--------|
| Notes timeline loading | Faster (single query) |
| Adding a quick note | Same UX, cleaner backend |
| Viewing narration history | Easier filtering by type |

**No negative UX impact**. The pattern is invisible to users.

### 4. Developer Experience Perspective

| Factor | Assessment |
|--------|------------|
| Learning curve | Medium (delegated_type is documented but not commonly used) |
| Debugging | Slightly harder (extra join to trace) |
| Testing | Similar complexity to current setup |

**Mitigation**: Include good inline documentation and link to 37signals resources.

### 5. Migration Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Data loss during migration | N/A | N/A | No production data |
| Schema drift from docs | Low | Low | Generate from ADR specs |

**Risk is minimal** because no production data exists.

### 6. Alternative Analysis

| Alternative | Why Not Chosen | Agreement |
|-------------|----------------|-----------|
| Option A: Separate models | Manual timeline merging | ✅ Agree to reject |
| Option B: STI | Wide table, NULL columns everywhere | ✅ Agree to reject |

**The alternatives were correctly evaluated.**

### ADR-003 Conclusion

**Status: ✅ APPROVED with minor suggestions**

1. Add factory/fixture examples to the ADR for test setup
2. Document the "create with nested recording" pattern for QuickNote
3. Add N+1 avoidance guidance (`includes(:recordable)`)

---

## ADR-004: Teachable Delegated Type (Teachable → Student/StudentGroup)

### 1. Technical Perspective

| Criterion | Assessment | Notes |
|-----------|------------|-------|
| **Pattern Fit** | ✅ Strong | "Thing that can be taught" is a real abstraction |
| **Complexity** | ⚠️ Higher | More tables, more joins |
| **Query Efficiency** | ⚠️ Moderate | `all_subjects` requires traversing group memberships |
| **Extensibility** | ✅ Excellent | Could add "ClassGroup" or "Cohort" later |

**Concern**: The `all_subjects` query is N+1 prone:
```ruby
def all_subjects
  teachable_ids = [teachable.id] + student_groups.map { |g| g.teachable.id }
  Subject.where(teachable_id: teachable_ids)
end
```

**Improvement**:
```ruby
def all_subjects
  Subject.where(teachable_id: all_teachable_ids)
end

def all_teachable_ids
  @all_teachable_ids ||= [teachable_id] +
    GroupMembership.where(student_id: id).joins(:student_group)
                   .pluck("teachables.id")
end
```

Wait—this still requires a join. Let's simplify:

```ruby
def all_subjects
  Subject.joins(:teachable)
         .where(teachables: { id: individual_and_group_teachable_ids })
end

private

def individual_and_group_teachable_ids
  ids = [teachable.id]
  ids += student_groups.includes(:teachable).map { |g| g.teachable.id }
  ids
end
```

Actually, the original is fine with eager loading. Document this in the ADR.

### 2. Domain Perspective

| Domain Concept | How ADR-004 Models It |
|---------------|----------------------|
| Najmi's Math (individual) | Subject → Teachable (Student: Najmi) |
| Family Picture Study | Subject → Teachable (StudentGroup: Family) |
| Najmi+Isa Foreign Language | Subject → Teachable (StudentGroup: joint) |

**Critical question**: What happens when the same subject is sometimes individual, sometimes group (e.g., "Math might be 1:1 some days, group other days")?

**Analysis**: The ADR implies **separate subjects** for these cases:
- "Najmi Math (individual)" = Subject A
- "Family Math Review" = Subject B

This is the correct approach. A subject's ownership is fixed; the *scheduling* of group vs. individual sessions is a separate concern (could be a future feature).

**Domain fit is strong** with this interpretation.

### 3. User Experience Perspective

| Scenario | Impact |
|----------|--------|
| Weekly grid for Najmi | Shows individual + group subjects ✅ |
| Marking Family Study complete | One completion affects everyone ✅ |
| Each child's narration for Picture Study | Each creates their own Recording ✅ |

**Positive UX impact**: Matches mental model of "family learning" vs "individual work."

### 4. Developer Experience Perspective

| Factor | Assessment |
|--------|------------|
| Learning curve | Higher (two delegated_type patterns to learn) |
| Debugging | More complex (more indirection) |
| Testing | More fixtures needed |

**Mitigation**:
1. Create a clear test helper for setting up teachables
2. Document the "which teachable owns what" mental model
3. Add view helpers to hide complexity (`subject.for_student?`)

### 5. Migration Risk

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| View breakage (subject.student removed) | High | Medium | Add transitional helpers |
| Confusion about Recording.student vs Narration.subject.teachable | Medium | High | Clear documentation |

**The view compatibility helpers in ADR-004 are essential**. The current codebase has 7+ views using `subject.student`.

### 6. Alternative Analysis

| Alternative | Why Considered | Why Not Chosen |
|-------------|----------------|----------------|
| Keep subjects tied to students, add group_subject_assignments | Simpler initially | Duplicates subject data per student |
| Use polymorphic owner_type/owner_id directly | Less abstraction | Loses query conveniences of delegated_type |

**Were alternatives fully explored?** The ADR could benefit from more explicit discussion of:
- **Polymorphic association** (simpler than delegated_type but less structured)
- **Just duplicate subjects** (each group member gets their own copy)

Let me evaluate polymorphic:

```ruby
# Polymorphic alternative
class Subject < ApplicationRecord
  belongs_to :owner, polymorphic: true  # Student or StudentGroup
end
```

**Comparison**:
| Factor | Delegated Type | Polymorphic |
|--------|---------------|-------------|
| Unified query for all teachables | `Teachable.all` | `students + student_groups` (manual) |
| User ownership | Clear (`teachable.user`) | Need to implement per type |
| Adding new teachable types | Add type to array | Works same way |

**Verdict**: Delegated type is marginally better for this use case because of the `user` ownership relationship centralized in Teachable.

### ADR-004 Conclusion

**Status: ✅ APPROVED with refinements**

1. Add explicit discussion of polymorphic alternative (show why delegated_type is better)
2. Add eager loading guidance for `all_subjects` query
3. Clarify that same-subject-different-context means separate Subject records
4. Keep the view compatibility helpers—they're critical

---

## Cross-Cutting Concerns

### Dependency Order

ADR-004 must be implemented **before** ADR-003. The current documentation correctly states this. Implementation order:

```
1. Plan 007 (Teachable Foundation) ← ADR-004
   └── 2. Plan 006 (Quick Notes)   ← ADR-003
```

### Dual Delegated Types: Complexity Concern

The system will have **two** delegated_type hierarchies:

```
Teachable → [Student, StudentGroup]   (who learns)
Recording → [Narration, QuickNote]    (what was captured)
```

**Is this too complex for a 3-user app?**

**Analysis**:
- The patterns are **orthogonal** (different concerns)
- Each pattern solves a **real problem** (group learning, unified timeline)
- No production data = perfect time to get foundations right
- The 37signals article endorses multiple delegated_type hierarchies

**Verdict**: Acceptable complexity. The patterns are isolated enough.

### Testing Strategy

Recommend creating test helpers:

```ruby
# test/support/teachable_helpers.rb
def create_individual_subject(student:, **attrs)
  Subject.create!(teachable: student.teachable, **attrs)
end

def create_group_subject(group:, **attrs)
  Subject.create!(teachable: group.teachable, **attrs)
end

# test/support/recording_helpers.rb
def create_narration_recording(student:, subject:, date:, **attrs)
  narration = Narration.create!(subject: subject, **attrs)
  Recording.create!(student: student, date: date, recordable: narration)
end
```

---

## Recommendations

### For ADR-003

1. **Add**: Factory/fixture examples for test setup
2. **Add**: Explicit N+1 prevention guidance
3. **Clarify**: Creation pattern (create Recording first, or QuickNote with nested Recording?)

### For ADR-004

1. **Add**: Explicit polymorphic alternative discussion
2. **Add**: Eager loading guidance for `all_subjects`
3. **Clarify**: Same-subject-different-context = separate Subject records
4. **Keep**: View compatibility helpers are essential

### For Implementation

1. Implement Plan 007 (Teachable) completely before starting Plan 006
2. Create comprehensive fixtures before refactoring
3. Run full test suite after each migration step
4. Consider feature flag for gradual rollout (even locally)

---

## Final Verdict

| ADR | Decision | Confidence |
|-----|----------|------------|
| ADR-003 (Recording) | ✅ Proceed | High |
| ADR-004 (Teachable) | ✅ Proceed | High |

Both patterns are well-suited for the domain requirements. The complexity is justified by:
1. Real domain needs (group learning, unified timeline)
2. Future extensibility (new teachable/recordable types)
3. No migration debt (no production data)
4. Proven pattern (37signals, Basecamp, HEY)

**Proceed with implementation per Plans 006 and 007.**
