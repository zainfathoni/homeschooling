# Plan 005: Responsive Navigation Epic

**Status:** Draft (High-level)  
**Created:** 2026-01-28  
**Depends on:** [002-weekly-grid-epic](002-weekly-grid-epic.md)

## Overview

Implement responsive navigation with mobile bottom nav and tablet Duet (split) view.

## Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| < 768px | Mobile: single column, bottom nav |
| ≥ 768px | Tablet: Duet split view (60/40), no bottom nav |

## Goal

- Mobile bottom navigation bar
- Tablet Duet view: weekly grid + daily focus side-by-side
- Smooth transitions between layouts
- Touch-friendly targets (44x44pt minimum)

## Mobile Bottom Nav Items

1. **Today** - Daily focus view
2. **Week** - Weekly grid
3. **Notes** - Narrations list
4. **Settings** - Student management, preferences

## Duet View (Tablet)

```
┌────────────────────┬─────────────────┐
│   Weekly Grid      │   Daily Focus   │
│   (60%)            │   (40%)         │
│                    │                 │
│   [Subject rows]   │   [Task cards]  │
│   [with 5-day      │   [with details]│
│    checkboxes]     │                 │
└────────────────────┴─────────────────┘
```

## UI Reference

- [Mockup: iPad Duet View](../mockups/04-ipad-duet-view.png)

## Technical Considerations

- CSS Grid or Flexbox for Duet layout
- Tailwind responsive prefixes (`md:`, `lg:`)
- Turbo Frames for independent panel updates
- Stimulus controller for responsive behavior

## Rough Task Outline

1. Mobile bottom nav component
2. Responsive layout wrapper
3. Duet view container
4. Panel synchronization (select day → update focus)
5. Touch target sizing audit

## Open Questions

- How to handle navigation state in Duet view?
- Animate transitions between layouts?
- PWA considerations for mobile?

---

*This plan will be refined before implementation.*
