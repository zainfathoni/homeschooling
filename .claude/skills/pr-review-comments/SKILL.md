---
name: pr-review-comments
description: Create a PR review with inline comments on specific lines using GitHub API
---

# PR Review with Inline Comments

Create a GitHub pull request review with inline comments on specific lines of code.

## Arguments

- `<pr-number>` - The PR number to review (required)

## Steps

1. **Get PR details and diff**

   ```bash
   gh pr view <pr-number>
   gh pr diff <pr-number>
   ```

2. **Analyze the changes** - Review the diff for:

   - Code correctness and potential bugs
   - Style and convention issues (run ESLint if applicable)
   - Performance implications
   - Security considerations
   - Test coverage

3. **Identify specific lines to comment on** - For each issue found, note:

   - File path (relative to repo root)
   - Line number in the new version of the file
   - The issue/suggestion to raise

4. **Create the review with inline comments** using GitHub API:

   ```bash
   # For a PENDING (draft) review - omit "event" field
   cat <<'EOF' | gh api repos/{owner}/{repo}/pulls/<pr-number>/reviews --method POST --input -
   {
     "body": "Summary of the review",
     "comments": [
       {
         "path": "path/to/file.js",
         "line": 42,
         "body": "Comment about line 42"
       },
       {
         "path": "path/to/another/file.js",
         "line": 10,
         "body": "Comment about line 10"
       }
     ]
   }
   EOF

   # To submit immediately, add "event": "COMMENT", "APPROVE", or "REQUEST_CHANGES"
   ```

## API Parameters

| Parameter         | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `event`           | Review action: `COMMENT`, `APPROVE`, `REQUEST_CHANGES`, or **omit for PENDING** |
| `body`            | Overall review summary (shown at top of review)                    |
| `comments`        | Array of inline comment objects                                    |
| `comments[].path` | File path relative to repo root                                    |
| `comments[].line` | Line number in the **new** version of the file (right side of diff)|
| `comments[].body` | The comment text (supports GitHub Markdown)                        |

## Comment Formatting Tips

- Use `**Bold**` for emphasis on issue type
- Use code blocks with language hints for suggested fixes
- Keep comments actionable and specific
- Reference documentation or style guides when relevant

## Example Comment Body

```markdown
**ESLint Error - Import Order Violation**

The `React.lazy()` import should come after static imports.

```javascript
// Move lazy imports after static imports
import { useState } from 'react';
import SomeModule from './module';

const LazyComponent = React.lazy(() => import('./lazy'));
```
```

## Review Events

| Event | Description |
| ----- | ----------- |
| *(omit field)* | Creates a **PENDING** (draft) review - user can edit before submitting |
| `COMMENT` | Submit feedback without explicit approval |
| `APPROVE` | Submit as approval |
| `REQUEST_CHANGES` | Submit requesting changes before merging |

**Note:** `PENDING` is not a valid event value - to create a draft review, omit the `event` field entirely.

## Notes

- Line numbers must reference lines that exist in the diff
- For multi-line comments, use the `line` parameter for the ending line
- The `{owner}/{repo}` placeholders are auto-resolved by `gh` CLI
