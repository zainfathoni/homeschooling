# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homeschool Planner - a weekly planning app for homeschooling families. Tracks daily subject completion, supports "Pick 1" curriculum choices, and captures learning narrations (text, voice, photo).

## Key Domain Concepts

1. **Subject Types**:
   - `fixed` - Checkbox every day (Math, Handwriting)
   - `scheduled` - Active only on specific days (Coding: Mon-Thu)
   - `pick1` - Select one sub-item per category (Islamic Study → Safar Book)

2. **Narrations**: Learning evidence captured as text, voice recordings, or photos, linked to subject and date

## Responsive Design

| Breakpoint | Layout                                                |
| ---------- | ----------------------------------------------------- |
| < 768px    | Mobile: single column, bottom nav                     |
| ≥ 768px    | Tablet: split "Duet" view (weekly grid + daily focus) |

## Design System

- **Colors**: Lavender (#E8E4F0) background, Coral (#F08080) primary accent, White (#FFFFFF) cards
- **Touch targets**: Minimum 44x44pt

## Tech Stack

- **Framework**: Rails 8.1 with Hotwire (Turbo + Stimulus)
- **Database**: SQLite with Solid Queue/Cache/Cable
- **Styling**: Tailwind CSS 4
- **Ruby**: 3.4.4

## Common Commands

```bash
bin/dev              # Start development server (with Tailwind watch)
bin/rails test       # Run tests
bin/rails db:migrate # Run migrations
bin/rubocop          # Run linter
bin/ci               # Run full CI suite (tests + linter + security)
```

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **Run quality gates** (if code changed) - Tests, linters, builds
2. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
3. **Verify** - All changes committed AND pushed

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
- `main` is protected - always work on a branch and create a PR
