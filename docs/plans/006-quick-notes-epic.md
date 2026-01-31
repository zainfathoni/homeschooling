# Plan 006: Quick Notes Epic

**Status:** Planning
**Created:** 2026-01-31
**Depends on:** [005-responsive-nav-epic](005-responsive-nav-epic.md) ✅

## Overview

Quick Notes are date-level observations distinct from subject-attached Narrations. They capture day-level context like "Field trip today", "Shortened lessons - dentist", or general reflections not tied to a specific subject.

## Key Distinction

| Feature         | Attached To    | Purpose                          | Examples                          |
| --------------- | -------------- | -------------------------------- | --------------------------------- |
| **Narrations**  | Subject + Date | Learning evidence for curriculum | "Tell me about the book you read" |
| **Quick Notes** | Date only      | Day-level observations           | "We visited the museum today"     |

## Goal

- New `QuickNote` model attached to student + date (not subject)
- Quick capture UI: FAB on mobile, section on tablet
- Display in daily view and notes timeline
- Text-only for v1 (voice deferred)

## Data Model

### Migration: CreateQuickNotes

```ruby
class CreateQuickNotes < ActiveRecord::Migration[8.0]
  def change
    create_table :quick_notes do |t|
      t.references :student, null: false, foreign_key: true
      t.references :week, null: false, foreign_key: true
      t.integer :day_index, null: false  # 0=Mon, 4=Fri
      t.text :content, null: false
      t.timestamps
    end

    add_index :quick_notes, [:student_id, :week_id, :day_index]
  end
end
```

### Model: QuickNote

```ruby
class QuickNote < ApplicationRecord
  belongs_to :student
  belongs_to :week

  validates :day_index, presence: true, inclusion: { in: 0..4 }
  validates :content, presence: true

  def date
    week.start_date + day_index.days
  end

  scope :for_date, ->(date) {
    week = Week.find_by(start_date: date.beginning_of_week(:monday))
    where(week: week, day_index: date.wday - 1) if week
  }

  scope :recent, -> { order(created_at: :desc) }
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

### Task 1: QuickNote Model & Migration

- Create migration
- Create model with validations
- Add association to Student and Week
- Unit tests

### Task 2: QuickNotes Controller

- CRUD actions
- Scoped to current student
- Turbo Stream responses

### Task 3: Quick Notes FAB (Mobile)

- Stimulus controller for modal
- Form partial
- Integration with daily view

### Task 4: Quick Notes Section (Tablet)

- Inline form partial
- Display existing notes
- Integration with Duet view

### Task 5: Notes Timeline Integration

- Update notes index to include QuickNotes
- Unified display with Narrations
- Filter by type (Narrations vs Quick Notes)

### Task 6: Tests

- Model tests
- Controller tests
- Integration tests for both breakpoints

## Dependencies

```txt
hs-qn.1 ─► hs-qn.2 ─┬─► hs-qn.3 ─► hs-qn.6
                    └─► hs-qn.4 ─► hs-qn.5 ─► hs-qn.6
```

## Issue Hierarchy

```txt
hs-qn (EPIC)
├── hs-qn.1: QuickNote model & migration
├── hs-qn.2: QuickNotes controller
├── hs-qn.3: Quick Notes FAB (mobile)
├── hs-qn.4: Quick Notes section (tablet)
├── hs-qn.5: Notes timeline integration
└── hs-qn.6: Tests
```

## Verification

After implementation:

1. `bin/rails test` - all tests pass
2. Mobile: FAB visible, modal opens, can save note without selecting subject
3. Tablet: Section visible in Duet view, inline form works
4. Notes view: Quick Notes appear alongside Narrations
5. Data: QuickNote records have student + week + day_index, no subject_id
