---
name: do-work
description: "Execute a unit of work end-to-end: plan, implement, validate with tsc and linting. Use when user wants to do work, build a feature, fix a bug, or implement the issue"
---

# Do Work

Execute a complete unit of work: plan it, build it, validate it.

## Workflow

### 1. Understand the task

Read any referenced issues or PRD. Explore the codebase to understand the relevant files, patterns, and conventions. If the task is ambiguous, ask the user to clarify scope before proceeding.

### 2. Plan the implementation (optional)

If the task has not already been planned, create a plan for it.

### 3. Implement

Leverage our existing codebase, skill set, and best practices.

### 4. Validate

Run the feedback loops and fix any issues. Repeat until scripts pass cleanly.

```
npm run tsc
npm run lint
```

If there are any tests, run them and fix any issues with refactoring as mentioned in [refactoring.md](../tdd/refactoring.md).