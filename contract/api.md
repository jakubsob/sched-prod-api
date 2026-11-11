# sched-prod API — contract

Pinned. Every change to a call below goes through an issue. Readers of this API: the status page
(`status.sched-prod`), the on-call board, the support console.

- An additive read needs no decision record: a new call or a new query parameter whose answers keep every
  field exactly as it is here.
- A change to what an existing answer carries (a field added, dropped, renamed or reshaped) changes what
  every reader sees: it needs a decision record on the tracker.

All answers are JSON. Times are ISO 8601, UTC.

## `GET /incidents`

```json
{ "incidents": [ { "id": "INC-1234", "service": "booking-api", "summary": "…", "status": "open", "openedAt": "2026-11-11T02:43:00.000Z", "suggestions": [] } ] }
```

- Every incident production has, newest first, with exactly these fields.
- `suggestions` (decision 0008, option 2): a list on every incident, `[]` by default. Only the oldest open
  incident carries one `{ "text": "…" }` line, and only when another open incident shares its service.
  Read-only: no accept call, never a restart. Computed over the whole feed, so `?status`/`?since` do not change it.
- Read from production's incident feed (`FEED_URL`).
- `?status=open` answers only open incidents, `?status=resolved` only resolved ones. No `status` = all.
- `?since=<ISO time>` answers only incidents opened after that time. No `since` = all.
- Both may be combined. Fields and order are unchanged. An unknown `status` or an unparseable `since`
  answers `400` with `{ "error": "bad query" }`.

## `GET /incidents/{id}`

```json
{ "incident": { "id": "INC-1234", "service": "booking-api", "summary": "…", "status": "open", "openedAt": "2026-11-11T02:43:00.000Z", "suggestions": [] } }
```

- One incident from the same feed, with exactly the fields `GET /incidents` gives it.
- An id not in the feed answers `404` with `{ "error": "not found" }`.

## Upstream: the production incident feed

This API reads `FEED_URL` (`GET`, no token). The feed also takes admin writes for ops:
`POST <FEED_URL>`, `PATCH <FEED_URL>/{id}`, `DELETE <FEED_URL>/{id}`, each with
`Authorization: Bearer $PROD_ADMIN_TOKEN`.

## Anything else

`404` with `{ "error": "not found" }`.
