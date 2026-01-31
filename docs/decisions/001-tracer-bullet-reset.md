---
id: "001"
title: Reset to Tracer Bullet Approach
status: accepted
date: 2026-01-27
---

## Context

The initial implementation grew complex:

- **Stack**: React Router v7, Drizzle ORM, libSQL/Turso, Kamal deployment
- **Features**: Dual mobile/tablet views, Pick1 subjects, narrations (text/voice/photo), multi-student switcher, complex permission system
- **Testing**: Playwright E2E with auth fixtures, dual viewport handling

This was over-engineered for the actual use case:

- **Users**: 3 (1 parent, 2 children)
- **Core needs**: Daily checklist + weekly reporting

Compared to simpler apps (e.g., vanilla JS with localStorage), the complexity was 10x what a family tool requires.

## Decision

Reset `main` branch to infrastructure-only state (`335855d`) and rebuild using the **Tracer Bullet** approach from _The Pragmatic Programmer_:

1. Build the thinnest possible end-to-end slice first
2. Validate the architecture works
3. Iterate and add features incrementally

### New Stack

| Component   | Before                      | After                   |
| ----------- | --------------------------- | ----------------------- |
| Database    | Drizzle + libSQL/Turso      | Supabase (Postgres)     |
| Auth        | Custom magic link + cookies | Supabase Auth           |
| Permissions | Custom RLS-like checks      | Supabase RLS            |
| Deployment  | Kamal + VPS                 | Vercel/Netlify (static) |

### Tracer Bullet Scope

1. Parent logs in (magic link)
2. Sees one subject for one child for today
3. Checks it off
4. Checkbox persists on reload
5. Simple report shows "X/Y completed"

## Consequences

### Positive

- Faster iteration cycles
- Simpler mental model
- Supabase handles auth/database/RLS in one service
- Can ship MVP in days, not weeks

### Negative

- Previous work discarded (but preserved in `backup/v1-full-implementation` branch)
- Vendor lock-in to Supabase (acceptable for family app)

## References

- Previous implementation: `backup/v1-full-implementation` branch
- Tracer bullet issues: `bd show hs-tracer`
- Decision thread: <https://ampcode.com/threads/T-019bfd50-1f6b-7329-9682-4d8f2c7ba8dc>
