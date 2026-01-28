# ADR 0002: Switch to Rails for Simplicity and Learning

## Status

Proposed

## Date

2026-01-28

## Context

Following ADR-0001's reset, we reconsidered the technology stack. The current setup is React Router v7 + TypeScript + Tailwind with ~15 lines of actual application code.

### The Simplicity Question

Nate Berkopec's observation about 37signals: their clean Rails code comes from **engineering discipline** (stay small, cut scope, hire well), not from Rails itself. However, Rails' conventions do reduce decision fatigue and boilerplate for CRUD-heavy apps.

### Current App Characteristics

| Characteristic | Implication |
|----------------|-------------|
| 3 users (family) | No scale concerns |
| CRUD-heavy (checklists, narrations) | Rails' sweet spot |
| File uploads (voice, photos) | ActiveStorage built-in |
| Simple auth | `has_secure_password` or Devise |
| Server-rendered + light interactivity | Hotwire's sweet spot |

### Professional Development Factor

The maintainer's day job involves a Rails + React codebase. They are:
- Already proficient in React
- Seeking to deepen Rails knowledge
- Looking for a simple project as a learning vehicle

A personal project with low stakes is ideal for learning a framework deeply.

### AI-Assisted Development Factor

Ruby's characteristics make it well-suited for AI-assisted development:

1. **Token efficiency**: Per Martin Alderson's research, Ruby averages ~115 tokens per task vs JavaScript at ~165 tokens (43% more). Static typed languages are even worse: Java ~190, Go ~205, C# ~210. Fewer tokens = longer context windows = better AI assistance.

2. **Human readability**: Ruby's concise syntax makes it faster for humans to review and verify AI-generated code. As DHH notes: "Ruby is not just highly token efficient for the LLMs, but even more so for humans. Being able to quickly read and verify what's been written by AI is a real advantage."

3. **Types unnecessary for AI**: Dynamic typing eliminates boilerplate that AI doesn't need. "AI just doesn't need the types that some programmers cling to." Ruby's duck typing and conventions provide enough context for AI to understand intent.

| Language | Avg Tokens/Task | vs Ruby | Type System |
|----------|-----------------|---------|-------------|
| Clojure | ~109 | 0.95x | Dynamic |
| Ruby | ~115 | 1.0x | Dynamic |
| Python | ~122 | 1.06x | Dynamic |
| JavaScript | ~165 | 1.43x | Dynamic |
| Java | ~190 | 1.65x | Static |
| Go | ~205 | 1.78x | Static |
| C# | ~210 | 1.83x | Static |

This project will be developed primarily with AI assistance (Claude Code), making token efficiency a practical consideration.

## Options Considered

### Option A: Stay with React Router v7

**Pros:**
- Setup already complete
- TypeScript throughout
- Familiar React patterns
- Single runtime (Node.js)

**Cons:**
- More boilerplate for CRUD operations
- Must configure: Prisma, auth, file uploads, flash messages
- No professional learning benefit (already know React)
- Estimated 40-50% more LoC for same features

### Option B: Switch to Rails 8 with Hotwire

**Pros:**
- Convention over configuration reduces decisions
- Built-in: migrations, validations, auth, file uploads, background jobs
- Hotwire (Turbo + Stimulus) handles interactivity without heavy JS
- Estimated 40-50% less LoC
- Direct professional development benefit
- 37signals' Basecamp/HEY prove it scales if needed

**Cons:**
- Discard current setup (~2-3 hours of work)
- Ruby runtime + potentially different deployment
- Learning curve (but this is also a pro)

### Option C: Rails API + React Frontend

**Pros:**
- Uses both technologies
- Mirrors day-job architecture

**Cons:**
- Most complex option
- Two codebases to maintain
- Defeats the simplicity goal

## Decision

**Switch to Rails 8 with Hotwire (Option B).**

### Rationale

1. **Simplicity**: Rails conventions eliminate boilerplate for exactly this type of app (CRUD + file uploads + simple auth)

2. **Learning**: Building a complete Rails app from scratch provides deeper understanding than maintaining an existing codebase

3. **Low sunk cost**: Only ~15 lines of application code exist; Tailwind config and design tokens are portable

4. **Aligned incentives**: Professional growth + personal project success point the same direction

5. **AI-assisted development**: Ruby's token efficiency and readability make it ideal for development with Claude Code

### New Stack

| Component | React Router v7 | Rails 8 |
|-----------|-----------------|---------|
| Framework | React Router v7 | Rails 8 |
| Database | Prisma + SQLite | ActiveRecord + SQLite |
| Auth | Supabase Auth | `has_secure_password` |
| File uploads | Manual setup | ActiveStorage |
| Interactivity | React components | Turbo + Stimulus |
| Styling | Tailwind CSS | Tailwind CSS (portable) |
| Background jobs | External service | Solid Queue (built-in) |

### What We Keep

- Design tokens (lavender, coral, white)
- Tailwind configuration approach
- CLAUDE.md conventions
- Issue tracking (34 issues still valid)
- Product vision and domain model
- Tracer bullet philosophy from ADR-0001

## Consequences

### Positive

- Less code to write and maintain
- Professional development aligned with day job
- Rails 8 is batteries-included (no external services needed)
- Community conventions mean less decision fatigue
- SQLite + Solid Queue = single-file deployment possible

### Negative

- Lose React Router v7 setup time (~2-3 hours)
- Must learn Rails conventions (but this is the goal)
- Ruby ecosystem vs JavaScript ecosystem

### Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Unfamiliar with Rails patterns | Start with `rails new`, follow Rails Guides |
| Over-engineering again | Apply same tracer bullet discipline from ADR-0001 |
| Scope creep via "learning" | Timebox learning; ship features, not experiments |

## Implementation Plan

1. Create new Rails 8 app with: `rails new homeschooling --css=tailwind --database=sqlite3`
2. Port design tokens to Tailwind config
3. Implement tracer bullet scope from ADR-0001:
   - Parent logs in
   - Sees one subject for one child for today
   - Checks it off
   - Persists on reload
4. Iterate from there

## References

- [Vanilla Rails is Plenty](https://dev.37signals.com/vanilla-rails-is-plenty/) - Jorge Manrubia, 37signals
- [Nate Berkopec on 37signals](https://x.com/nateberkopec/status/2015966051650191531) - "37signals' code looks great because of their engineering strategy"
- [Which programming languages are most token-efficient?](https://martinalderson.com/posts/which-programming-languages-are-most-token-efficient/) - Martin Alderson
- [Why Ruby Shines in the Age of AI-Powered Development](https://dev.to/daviducolo/why-ruby-shines-in-the-age-of-ai-powered-development-a-token-efficiency-story-25kh) - DEV Community
- ADR-0001: Tracer Bullet Reset
- [Rails 8 Release Notes](https://rubyonrails.org/)
