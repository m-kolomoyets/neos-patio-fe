# 00 — Confirm slug style with client (HITL)

## What to build

No code. A decision gate.

The PRD specifies cleaned ASCII slugs: accents folded to plain Latin, lowercase, hyphen-separated (`Château de Chambord` → `chateau-de-chambord`). The alternative the client may prefer is preserving the original name with minimal transformation (`Château_de_Chambord`), which the browser transmits percent-encoded and which degrades to an unreadable string outside the address bar.

A Slack message asking this question has already been drafted. This slice is: send it, get an answer, record the answer here.

The blast radius of either answer is one function body. Routing, resolution, caching, redirects, and every downstream slice are identical under both choices.

## Acceptance criteria

- [ ] Question sent to the client, including the percent-encoding tradeoff and a concrete example of each option
- [ ] Answer received and recorded in this file
- [ ] If the answer is "cleaned ASCII": no change to the PRD; slice 01 proceeds as written
- [ ] If the answer is "original name, minimal transformation": the slug generation section of the PRD and the slugify test cases in slice 01 are amended before slice 01 starts, and the reserved `id<digits>` guard plus the empty-output fallback are confirmed to still apply
- [ ] Downstream slices 02–05 confirmed unaffected either way

## Blocked by

None - can start immediately.
