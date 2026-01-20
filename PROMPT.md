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

## Completion Signal

After pushing, run `bd ready` to check for remaining issues. Only output **COMPLETE** if `bd ready` returns no issues. Otherwise, end the session silently (the script will start a new session).
