---
name: client-slack-message
description: Compose a formal Slack message to a client or external teammate from raw context or a rough draft. Use when the user wants to write/polish a message to a client, ask a client for clarification, report progress or a demo, hand off a repo or credentials, push back on a technical decision, or chase a blocker.
---

# client-slack-message

Input: raw context or a rough draft. Output: one Slack-ready message in the user's voice.

Every message carries exactly one **ask** — the thing the recipient must do or answer. Find it before writing; if the input has none, the message is an FYI and says so explicitly.

## Steps

1. **Name the ask and the archetype.** Read the input, state to yourself the single ask in one sentence, and pick an archetype below. If the input holds two unrelated asks, say so and recommend two messages.
2. **Draft into the skeleton.** Fill every slot in order. Slots marked optional may be dropped; the rest are mandatory.
3. **Apply the rules.** Walk the rule list top to bottom against the draft. Done when every rule has been checked, not when the draft reads fine.
4. **Deliver.** Output the message in a code block (so Slack markup survives copy-paste), then a one-line note of what you assumed or what the user still must attach (video, screenshot, file, link).

## Skeleton

```
@Recipient

Hi, hope you are doing well.

[optional acknowledgment — thank them for feedback/progress before anything else]
[context — what you did, noticed, or were asked, 1-3 short paragraphs]
[the ask — "Could you please ..." / "Should we ...?" / "Kindly reminding to ..."]
[optional detail — bullets, links, attachment references]
[optional check — "Please let me know if everything is clear or you need something else."]

Thanks in advance :raised_hands:
```

## Rules

- **One ask, up front-ish.** The ask lands after context, never buried below the detail bullets.
- **Justify the ask.** State why it matters to them — performance, blocked deploy, UI mismatch, matching their vision. An ask with no consequence gets ignored.
- **Blocked means say so.** If work is stopped waiting on them, name it as blocking and name what unblocks it.
- **Soften critique, keep it concrete.** Concede their constraint first ("I understand some features are critical and have to ship fast"), then the ask, then the fix that costs them least (reuse an existing component, copy an existing module, refer to docs). Never critique without the fix.
- **Bullets for lists of ≥3.** Facts, findings, and review points go in bullets, not a run-on paragraph.
- **Short paragraphs, blank lines between.** No wall of text.
- **Plain, polite, hedge-free.** "Could you please clarify" not "I was just wondering if maybe". Simple words over formal ones.
- **Spellcheck every proper noun and term.** Product names, people, file names, commands, URLs. Typos here are the most common defect in the user's drafts.
- **Emoji: at most one, at the close.** `:raised_hands:` default. `:typingcat:` for light/personal notes.
- **Reference attachments by number** when more than one — "(attachment 1)", "(attachment 2)".
- **cc line last** — `@Name cc` on its own line after the sign-off if someone needs visibility only.

## Archetypes

| Archetype | Use when | Shape |
|---|---|---|
| **clarify** | need info only the client has (asset paths, env vars, API capabilities, missing infra) | context → what you already know/the pattern you observed → the exception → the question |
| **update** | demo, progress report, feature landed | greeting → what shipped as bullets → where to see it (link/video/attachment) → invite feedback |
| **handoff** | delivering repo, credentials, instructions | greeting → the deliverable + link → prerequisites (env files, uploads) → where the run instructions live → offer further help |
| **pushback** | client or teammate choice hurts the product (stack mismatch, missing a11y, skipped review) | acknowledge their constraint → the mismatch and its cost → the ask → the cheaper correct path |
| **chase** | environment down, pipeline failing, review comments ignored | what broke → what you already investigated → the ask → link the related thread/MR → guard against recurrence |
| **ack** | agreeing, confirming, answering yes/no | lead with the verdict (`TL;DR - Yes`) → the reasoning → what you need from them to proceed |

## Voice

The user's own greeting and close are fixed fixtures — keep them. Everything between is first-person, direct, mildly warm, no corporate padding. Speak as "I" for individual work, "we" when the team owns it. Never invent facts, links, ticket numbers, or dates the input did not supply — mark them `[...]` for the user to fill.
