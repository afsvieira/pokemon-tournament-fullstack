# Map: Round-by-round Tournament

## Destination

Every decision `/to-spec` needs to write `.scratch/round-by-round-tournament/spec.md` for the round-by-round Tournament in `docs/assessment-v2.pdf`, with nothing left to decide. This map plans only; implementation follows through `/to-spec` → `/to-tickets` → `/implement`.

## Notes

- Source of truth: `docs/assessment-v2.pdf`. Scope is what it asks for and what reaching it requires, plus cheap performance improvements: those are this effort's addition, not something the PDF asks for, and the PR must name them as extras. Nothing else: keep the solution simple.
- The Instant Simulation (`GET /pokemon/tournament/statistics` and the `/tournament` page) keeps its contract, behaviour and rate limit: existing customers rely on it.
- The battle rules stay as they are (`BattleSimulator.DetermineBattleOutcome`).
- Vocabulary: `GLOSSARY.md`. Code context: `.claude/ARCHITECTURE.md`. Conventions: the `coding-standards` skill.
- Every ticket here is a grilling: call the Skill tool for "grilling" and "domain-modeling".
- Closed GitHub issues #2–#8 are an abandoned, over-elaborate earlier attempt at this feature; don't reuse them.

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

- [New endpoints contract](issues/01-new-endpoints-contract.md): REST routes under `pokemon/tournament` (`POST` Start, `POST {id}/rounds`, `GET {id}`, `GET {id}/rounds/{n}`, `GET {id}/battles/{battleId}`, `GET history`); Guid Tournament ids, Battle ids 1–120 in play order; Battles carry a nullable `winnerId`; generic `{ error }` bodies with 404/409/502.
- [Rate limit for the new endpoints](issues/02-rate-limit-for-new-endpoints.md): two new per-IP policies with their own counters: Start 10/min with no queue, Process Round and new GETs 60/min with no queue; Instant Simulation untouched; empty 429 body; every policy's numbers move to `appsettings.json`, failing at startup if missing.
- [Performance improvement worth adding](issues/03-performance-improvement.md): in-memory cache of PokéAPI responses by Pokémon id (singleton `IMemoryCache`, immutable snapshots, lazy, no expiry), shared by Start and the Instant Simulation; nothing else.
- [Tournament in memory](issues/04-tournament-in-memory.md): circle-method pairings over the Start order, each Round decided when processed; singleton `InMemoryTournamentRepository`; `TournamentPokemon` reused as Standings; new methods on `TournamentService`; one lock per Tournament.
- [Round-by-round frontend flow](issues/05-frontend-flow.md): `/round-by-round` (Tournament History with Start) and `/round-by-round/:id` (Round chips, Round panel, Battle modal, sortable Standings cards) beside an unchanged `/tournament`; `RoundByRoundService` with typed models and a shared `API_BASE_URL`.
- [Error experience in the new views](issues/06-error-experience-in-new-views.md): API `error` shown as is, else a fixed message by status; inline panel with Retry when a page fails to load, toast when an action fails, message inside the Battle modal; any 404 on a Tournament shows a "no longer exists" page; a 409 in a stale tab reloads the Tournament.

## Not yet specified

<!-- in-scope fog you can't ticket yet; graduates as the frontier advances -->

## Out of scope

<!-- work ruled beyond the destination; closed, never graduates -->

- A database or any persistence across API restarts: the PDF asks for in-memory only.
- Users, auth, or a per-user Tournament History: the PDF has no notion of users.
- Expiring or cleaning up Tournaments held in memory: not asked for.
- Changes to the battle rules: the PDF keeps them as they are.
- Changes to the Instant Simulation endpoint or page: existing customers rely on them.
- Extras the PDF doesn't ask for, such as a Tournament leader, the reason a Battle was won, or animations.
