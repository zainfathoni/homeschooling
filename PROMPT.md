# Daily Work Session

## Objective

Complete one beads issue per session with full quality gates. Working directory: /Users/zain/Code/GitHub/zainfathoni/homeschooling

## Project Context

Homeschool Planner - weekly planning app for homeschooling families. Tracks daily subject completion, "Pick 1" curriculum choices, and learning narrations.

## Workflow

1. Find work: Run `bd ready` to pick 1 workable issue (check ./LOG.md for context)
2. Claim it: `bd update <id> --status in_progress`
3. Implement: Complete the work with tests
4. Verify: Run quality gates (tests, linters, builds as applicable)
5. Land the plane: Close issue, commit, push to remote

## Landing the Plane

```bash
bd close <id>
git add .
git commit -m "<descriptive message>"
bd sync
git push
```

## Logging

Append one-liner to ./LOG.md: `- YYYY-MM-DD - HH:mm:ss: <issue-id> - <brief description>`

## Completion Signal

When all tasks are done and pushed, output: **COMPLETE**
