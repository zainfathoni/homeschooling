# Plan 003: Subject Types Epic

**Status:** Draft (High-level)  
**Created:** 2026-01-28  
**Depends on:** [002-weekly-grid-epic](002-weekly-grid-epic.md)

## Overview

Implement the three subject types from PRODUCT_VISION: fixed, scheduled, and pick1.

## Subject Types

| Type | Behavior | Example |
|------|----------|---------|
| `fixed` | Checkbox every day | Math, Handwriting |
| `scheduled` | Active only on specific days | Coding (Mon-Thu) |
| `pick1` | Choose one option per category | Islamic Study → Safar Book |

## Goal

- Add `subject_type` enum to Subject model
- Scheduled subjects: store active days, show as inactive on off-days
- Pick1 subjects: sub-options with radio selection
- UI adapts based on subject type

## Database Changes (Tentative)

```ruby
# subjects table additions
add_column :subjects, :subject_type, :string, default: "fixed"
add_column :subjects, :scheduled_days, :json  # [0,1,2,3] for Mon-Thu

# New table for pick1 options
create_table :subject_options do |t|
  t.references :subject
  t.string :name
end
```

## UI Reference

- [Mockup: Daily Focus](../mockups/02-mobile-daily-focus.png) - Pick1 selector

## Rough Task Outline

1. Subject type enum and migration
2. Scheduled days logic
3. Pick1 options model and UI
4. Subject form updates
5. Grid display adaptations

## Open Questions

- How to visualize "not today" for scheduled subjects?
- Pick1: track which option was selected per day?
- Can subject type be changed after creation?

---

*This plan will be refined before implementation.*
