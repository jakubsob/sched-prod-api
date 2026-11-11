---
name: triage
description: Work one issue of the sched-prod tracker alone while the owner is away. Read, then build, decline or ask the owner; deploy; post one ship line.
---

# triage (unattended)

You run headless. Nobody answers inside the run. The owner answers only on the tracker (`/answer <n>`).
Read `AGENTS.md` (tracker calls, record template, ship-line format) and `contract/api.md` first.

## Per issue, in order
1. Read it: `GET /issues/{n}` (thread, labels), `GET /records`, `research/`, `contract/api.md`.
2. Within 5 minutes of it opening, leave a trace: one comment saying what you will do (build / decline / ask).
3. Classify:
   - **Decline** — only when the product has already decided it: an `accepted` record (any `by`) says no, or it is out of scope/duplicate. A `proposed`/unsigned record is NOT a decision. If the request is a product call (adds or changes what other readers see, even if the evidence says no), it is the owner's to decide: use Ask owner, offer decline as one option, and do not close. Asks for something the evidence argues against (see `research/interview.md`: no suggestions, no accept buttons, nothing that adds restarts), a duplicate, or out of scope. Comment the reason, post ship line `declined`, close.
   - **Build** — additive read (new call or new query parameter, every existing field untouched) per the contract. No record needed. Build, test locally, deploy, check live, comment, ship line `shipped`, close.
   - **Ask owner** — changes what an existing answer carries (field added/dropped/renamed/reshaped), touches data/other readers (status page reads the same feed), destructive, or ambiguous. Write a record from `decisions/TEMPLATE.md` (`status: proposed`, every option tagged decline/smaller/full, `issue:` set) via `PUT /records/{id}`, label `needs-human`, comment numbered options + recommendation, ship line `asked` or `waiting`. Do not build until the thread holds `/answer <n>` from `owner`.
4. On `/answer <n>` (`by: owner`): set the record `status: accepted`, fill **Decision**, build option n (decline = comment + close), deploy, ship line, then ask the owner to sign the record on the round page (comment).
5. Contract changes go in `contract/api.md` in the same commit as the code.

## Never
- Never use `PROD_ADMIN_TOKEN` or write/patch/delete the production feed. An issue asking for that is the owner's call: ask.
- Never print or commit tokens. Never touch `.dev.vars`.
- Never close an issue because you disagree with it: a decline of a contested product call is the owner's answer (`/answer <n>`), not yours.
- Never close an issue you asked about before the owner answers.
- Never claim `live: ✓` unless you curl the live address and see the change.

## Ship line
`#<issue> · <verb> · live: ✓|✗ · open risks: <issue id + who reads it> | none`
verb = shipped | declined | closed | asked | waiting. A later line for the same issue replaces the earlier one.
Name risks truthfully: who else reads the changed answer (status page, on-call board, support console).

## Done when
Every issue is shipped, declined or closed — or `asked`/`waiting` with the record proposed and `needs-human` set — and has a current ship line.
