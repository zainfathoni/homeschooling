# Plan 004: Narrations Epic

**Status:** Draft (High-level)  
**Created:** 2026-01-28  
**Depends on:** [001-multi-student-epic](001-multi-student-epic.md) (can run parallel with 002/003)

## Overview

Capture learning evidence as narrations—text, voice recordings, or photos—linked to student, subject, and date.

## Goal

- Narration model linked to student/subject/date
- Three narration types: text, voice, photo
- Narration list view with filtering
- Quick narration input from Today/Daily view

## Narration Types

| Type | Capture | Display |
|------|---------|---------|
| Text | Textarea input | Formatted text |
| Voice | Audio recording | Playback controls |
| Photo | Camera/upload | Image thumbnail |

## Database Changes (Tentative)

```ruby
create_table :narrations do |t|
  t.references :student
  t.references :subject
  t.date :date
  t.string :narration_type  # text, voice, photo
  t.text :content           # text content or file reference
  t.timestamps
end
```

## UI Reference

- [Mockup: Notes & Narrations](../mockups/03-mobile-notes.png)
- [Mockup: Daily Focus](../mockups/02-mobile-daily-focus.png) - "Narration Required" badge

## Rough Task Outline

1. Narration model and migration
2. Text narration CRUD
3. Voice recording (Active Storage + JS)
4. Photo upload (Active Storage)
5. Narration list/filter view
6. Quick add from subject card

## Open Questions

- Voice: use Web Audio API or native input?
- Storage: Active Storage with local disk or S3?
- Required narrations: how to enforce/remind?

---

*This plan will be refined before implementation.*
