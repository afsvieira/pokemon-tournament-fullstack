# Map: Round-by-round Tournament

## Destination

Every decision `/to-spec` needs to write `.scratch/round-by-round-tournament/spec.md` for the round-by-round Tournament in `docs/assessment-v2.pdf`, with nothing left to decide. This map plans only; implementation follows through `/to-spec` → `/to-tickets` → `/implement`.

## Notes

- Source of truth: `docs/assessment-v2.pdf`. Scope is what it asks for, what reaching it requires, and cheap performance improvements. Nothing else: keep the solution simple.
- The Instant Simulation (`GET /pokemon/tournament/statistics` and the `/tournament` page) keeps its contract, behaviour and rate limit: existing customers rely on it.
- The battle rules stay as they are (`BattleSimulator.DetermineBattleOutcome`).
- Vocabulary: `GLOSSARY.md`. Code context: `.claude/ARCHITECTURE.md`. Conventions: the `coding-standards` skill.
- Every ticket here is a grilling: call the Skill tool for "grilling" and "domain-modeling".
- Closed GitHub issues #2–#8 are an abandoned, over-elaborate earlier attempt at this feature; don't reuse them.

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

## Not yet specified

<!-- in-scope fog you can't ticket yet; graduates as the frontier advances -->

- Error experience in the new views: unknown Tournament (404), rate limit hit (429), PokéAPI down on Start. Hangs on [New endpoints contract](issues/01-new-endpoints-contract.md) and [Rate limit for the new endpoints](issues/02-rate-limit-for-new-endpoints.md).

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

- A database or any persistence across API restarts: the PDF asks for in-memory only.
- Users, auth, or a per-user Tournament History: the PDF has no notion of users.
- Expiring or cleaning up Tournaments held in memory: not asked for.
- Changes to the battle rules: the PDF keeps them as they are.
- Changes to the Instant Simulation endpoint or page: existing customers rely on them.
- Extras the PDF doesn't ask for, such as a Tournament leader, the reason a Battle was won, or animations.
