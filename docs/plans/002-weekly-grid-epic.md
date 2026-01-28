# Plan 002: Weekly Grid Epic

**Status:** Draft (High-level)  
**Created:** 2026-01-28  
**Depends on:** [001-multi-student-epic](001-multi-student-epic.md)

## Overview

Replace the single-day Today view with a full Mon-Fri weekly grid showing all subjects and their completion status across the week.

## Goal

- Weekly grid: subjects as rows, days (Mon-Fri) as columns
- Visual completion tracking with checkboxes
- Highlight current day
- Weekly progress percentage display

## Key Features

1. **Weekly Grid View** - 5-column layout for weekdays
2. **Day Highlighting** - Current day visually distinct
3. **Progress Bar** - "X/Y completed this week" at top
4. **Day Navigation** - Select day for detailed view (mobile)

## UI Reference

- [Mockup: Mobile Weekly Overview](../mockups/01-mobile-weekly-overview.png)
- [Mockup: iPad Duet View](../mockups/04-ipad-duet-view.png)

## Technical Considerations

- Week boundary handling (start of week)
- Efficient query for week's completions
- Responsive: stacked on mobile, grid on tablet

## Rough Task Outline

1. Week date range helper
2. Weekly grid component
3. Day selector (mobile)
4. Progress calculation
5. Current day highlighting

## Open Questions

- Should Today view remain separate or merge into Weekly?
- Week start: Monday or Sunday?
- How to handle weeks that span months?

---

*This plan will be refined before implementation.*
