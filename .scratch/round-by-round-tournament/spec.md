# Spec: Round-by-round Tournament

Status: done
Map: [Round-by-round Tournament](map.md)

## Problem Statement

Today the app has a single flow, the Instant Simulation. One click fetches 16 random Kanto Pokémon, computes all 120 Battles at once and shows only the final statistics. The user can't watch a Tournament unfold, see which Pokémon fought each other in which Round, or go back to an earlier Round or a single Battle. Nothing is kept: a result disappears as soon as the user generates another, so there is no Tournament History to return to.

Existing customers rely on the Instant Simulation endpoint and page as they are. The new experience has to be added beside them without changing their contract, behaviour or rate limit.

## Solution

Add a round-by-round Tournament that the user runs and watches step by step, while the Instant Simulation stays as it is.

- **Start Tournament**: picks 16 Pokémon and creates a Tournament held in the API's memory. All 16 appear on screen at 0 wins, losses and ties.
- **Process Round**: resolves the next of the 15 Rounds. The 16 Pokémon are paired into 8 Battles, the existing battle rules decide each one, and the page shows that Round's results and the updated Standings.
- **Review**: the user can go back to any earlier Round, open any single Battle, and browse the Tournament History, the Tournaments started since the API last started. From the History they can reopen a Tournament, and resume it if it isn't Complete.

The API exposes this through new endpoints under `pokemon/tournament`, and the frontend talks to them through a typed service. Two cheap improvements ship with it:

- an in-memory cache of PokéAPI responses, shared with the Instant Simulation;
- rate limits suited to each new endpoint, with every rate limit's numbers moved to configuration.

## User Stories

### Running a Tournament

1. As a user, I want a Start Tournament button, so that I can begin a new round-by-round Tournament.
2. As a user, I want all 16 Pokémon shown at 0 wins, losses and ties right after Start, so that I see everyone begin even.
3. As a user, I want each Pokémon card to show its image, type, base experience, wins, losses, ties and win rate, so that I recognise it and follow its progress.
4. As a user, I want a Process Round button, so that I can advance the Tournament one Round at a time.
5. As a user, I want each processed Round to show its 8 Battles, which Pokémon fought which and who won, so that I can follow what happened.
6. As a user, I want a tie shown as a tie rather than as a win for either side, so that results read correctly.
7. As a user, I want the Standings on the cards to update after every Round, so that I see the running Standings.
8. As a user, I want to sort the Standings cards by wins, losses, ties, name or id in either direction, with wins descending as the default, so that I can read the Standings the way I like.
9. As a user, I want the page to show which Round the Tournament has reached out of 15, so that I know how far along it is.
10. As a user, I want the Process Round button to be disabled while a Round is being processed, so that a double click doesn't skip a Round.
11. As a user, I want the Process Round button replaced by a Complete badge after Round 15, so that I know the Tournament has ended and can't try to go further.
12. As a user, I want every Pokémon to fight every other Pokémon exactly once over the 15 Rounds, so that the Tournament is a fair round-robin.
13. As a user, I want each Pokémon to fight exactly once in every Round, so that no Pokémon sits a Round out.
14. As a user, I want the battle rules to stay as they are (type advantage, then higher base experience, then a tie), so that results stay consistent with the Instant Simulation.

### Reviewing

15. As a user, I want one chip per Round, with the played Rounds clickable, so that I can go back to any earlier Round.
16. As a user, I want chips for Rounds not yet played to be visibly disabled, so that I can tell what's still to come.
17. As a user, I want to see a "No Rounds yet" message before Round 1, so that the empty Round panel makes sense.
18. As a user, I want the cards to keep showing the current Standings while I look at an earlier Round, so that the Standings are never ambiguous.
19. As a user, I want to click a Battle to open it in a modal showing both Pokémon (image, type, base experience) and the winner, or a tie, so that I can review a single Battle.
20. As a user, I want each Battle labelled with its number within the Tournament (1–120), so that I can refer to it.
21. As a user, I want the "View Battles" button hidden on round-by-round cards, so that I'm not offered an empty history; the Round panel already shows the Battles.

### Tournament History

22. As a user, I want a Tournament History page listing the Tournaments started since the API last started, newest first, so that I can find past Tournaments.
23. As a user, I want each History entry to show when it started and how many Rounds it has played, marked when Complete, so that I can tell entries apart and see their progress.
24. As a user, I want to open a Tournament from the History, so that I can review its Rounds and Battles.
25. As a user, I want to resume a Tournament that isn't Complete after reopening it, so that I can finish it later.
26. As a user, I want Tournaments I haven't finished to appear in the History too, so that I can come back to them.
27. As a user, I want an empty state saying no Tournaments exist since the API last started, so that an empty list isn't confusing.
28. As a user, I want a way back to the Tournament History from a Tournament page, so that I can move between them easily.
29. As a user, I want the Start Tournament button on the History page, so that I can start a new Tournament from the same place I browse past ones.

### Navigation and the Instant Simulation

30. As a user, I want a navigation bar with "Instant Simulation" and "Round by Round", so that I can switch between the two flows.
31. As an existing customer, I want the Instant Simulation page to stay where it is and work exactly as before, so that nothing I rely on breaks.
32. As an existing customer, I want the Instant Simulation endpoint to keep its contract, results and rate limit, so that my integration keeps working.
33. As an existing customer, I want the Instant Simulation to get faster and to stop overloading PokéAPI, with identical results, so that I benefit without having to change anything.

### Errors

34. As a user, I want a clear message when the API is unreachable, so that I know to check the server.
35. As a user, I want a message telling me to wait when I hit a rate limit, so that I know to slow down rather than assume something broke.
36. As a user, I want a clear message when a Tournament can't be started because Pokémon data is unavailable, so that I know to try again later.
37. As a user, I want a page that fails to load to show the error with a Retry button, instead of an empty list or blank page, so that I don't mistake an error for "no data".
38. As a user, I want a failed action (Start, Process Round, opening a Round) to show a toast and leave the page as it was, so that I can simply try again.
39. As a user, I want a Battle that fails to load to show the error inside its modal, so that I can close it and carry on.
40. As a user, I want a Tournament that no longer exists (after an API restart, or from a bad link) to show a page explaining that Tournaments live in memory until the API restarts, with links to the Tournament History and to start a new Tournament, so that I understand what happened and can move on.
41. As a user with two tabs open on the same Tournament, I want a tab that tries to process a Round after the other tab completed the Tournament to refresh itself and tell me the Tournament is already Complete, so that the stale tab catches up.

### API clients

42. As an API client, I want to start a Tournament with `POST /pokemon/tournament` and get its id, start time and 16 Pokémon back with a `Location` header, so that I can drive a Tournament without the UI.
43. As an API client, I want to process the next Round with `POST /pokemon/tournament/{id}/rounds`, without choosing the Round myself, and get its 8 Battles and the updated Standings, so that the API keeps the sequence right.
44. As an API client, I want to fetch a Tournament, a played Round and a single Battle by id, so that I can review any of them later.
45. As an API client, I want `GET /pokemon/tournament/history` to list Tournaments newest first, so that I can find them.
46. As an API client, I want 404 for an unknown Tournament, Round or Battle and 409 when processing a Round on a Complete Tournament, each with a short `{ error }` message, so that I can react to each case.
47. As an API client, I want 502 when PokéAPI fails during Start, and no half-created Tournament left behind, so that I know a retry is safe.
48. As an API client, I want error responses to never expose stack traces, exception messages or upstream details, so that the API leaks nothing about its internals.
49. As an API client, I want concurrent Process Round calls on the same Tournament to be handled one after another, so that Round numbers are never duplicated or skipped.
50. As an API client, I want the round-by-round endpoints not to consume the Instant Simulation's rate limit, so that the two flows don't throttle each other.

### Operations

51. As an operator, I want every rate limit's numbers (permits per window, window length, queue size) in application configuration, so that I can tune them without changing code.
52. As an operator, I want the API to refuse to start when a rate limit section is missing or invalid, so that a misconfiguration surfaces at once instead of silently falling back.
53. As an operator, I want PokéAPI responses cached in memory, so that the API respects PokéAPI's fair use policy and isn't at risk of an IP ban.
54. As an operator, I want the API to start even when PokéAPI is unreachable, so that startup never depends on an external service.

## Implementation Decisions

### API contract

All new endpoints live on the existing `TournamentController` under `pokemon/tournament`, beside the unchanged `GET statistics`. JSON stays camelCase. A Tournament id is a Guid and route parameters are constrained (`guid`, `int`), so `history` and `statistics` are never captured as an id.

| Verb | Route | Success | Body |
|---|---|---|---|
| POST | `/pokemon/tournament` | 201, `Location: /pokemon/tournament/{id}` | Tournament |
| POST | `/pokemon/tournament/{id}/rounds` | 201, `Location: /pokemon/tournament/{id}/rounds/{roundNumber}` | `{ roundNumber, battles[8], standings[16] }` |
| GET | `/pokemon/tournament/{id}` | 200 | Tournament |
| GET | `/pokemon/tournament/{id}/rounds/{roundNumber}` | 200 | `{ roundNumber, battles[8] }` |
| GET | `/pokemon/tournament/{id}/battles/{battleId}` | 200 | Battle |
| GET | `/pokemon/tournament/history` | 200 | `[{ id, startedAt, roundsPlayed }]`, newest first, unfinished Tournaments included, no paging |

- Start and Process Round take no request body. The API picks the next Round and its pairs.

#### Payloads

- **Tournament**: `{ id, startedAt, roundsPlayed, standings }`. `startedAt` is UTC ISO 8601. At Start, `standings` holds the 16 selected Pokémon at 0 wins, losses and ties.
- **Standings entry**: `{ id, name, type, baseExperience, imageUrl, wins, losses, ties, winRate }`, the Instant Simulation's Pokémon shape without `battleRecords`. Standings are always returned in Start order; the API never re-sorts them.
- **Battle**: `{ id, roundNumber, pokemon1, pokemon2, winnerId }`.
  - `pokemon1` and `pokemon2` are `{ id, name, type, baseExperience, imageUrl }`, with no wins, losses or ties.
  - `winnerId` is the winning Pokémon's id, or `null` on a tie.
- **Ids**: Round numbers run 1–15. Battle ids run 1–120 within their Tournament, numbered in play order: Round r holds Battles 8(r−1)+1 … 8r.
- **Names** are capitalized as in the Instant Simulation.

#### Errors

Expected failures answer `{ error: "<message>" }` with a fixed, generic message. Details go only to the log.

| Case | Status | `error` |
|---|---|---|
| Well-formed Tournament id not held in memory | 404 | `Tournament not found.` |
| Round outside 1–15, or not yet played | 404 | `Round not found.` |
| Battle outside 1–120, or not yet played | 404 | `Battle not found.` |
| Malformed id | 404, empty body | none: no route matches |
| Process Round on a Complete Tournament | 409 | `Tournament is already complete.` |
| PokéAPI fails on Start, or returns fewer than 16 Pokémon | 502 | `Could not start a tournament right now. Try again later.` |
| Anything unexpected | 500 | as `statistics` does today: `Problem("An unexpected error occurred")` |
| Rate limit exceeded | 429, empty body | none: comes from the rate limiter middleware |

- A failed Start creates nothing and adds nothing to the Tournament History.
- The service reports each case separately (unknown Tournament, unknown Round or Battle, Complete Tournament, too few Pokémon or PokéAPI failure), so the controller can map it to its status. The mechanism is left to implementation.
- Every new action carries XML doc comments and `ProducesResponseType` attributes, as `statistics` does.

### Tournament domain and schedule

- **New domain types**:
  - A **Tournament**: id, start time, its 16 Pokémon in Start order, and the Rounds played so far.
  - A **Round**: its number and its 8 Battles.
  - A **Battle**: id, Round number, the two Pokémon ids and the nullable winner id.
- **Pairing**: Rounds are paired with the circle method over the Start order. The first Pokémon stays fixed and the other 15 rotate one position per Round, which yields 15 Rounds of 8 Battles with every pair meeting exactly once.
- **When Battles are decided**: Round r's pairs are a pure function of r and the Start order. They are computed only when Round r is processed, and `BattleSimulator.DetermineBattleOutcome` decides each Battle then. Nothing about future Rounds is stored.
- **Battle order and sides**: within a Round, Battles keep circle-method order. `pokemon1` is whichever Pokémon of the pair comes first in the Start order.
- **Standings**: a Tournament's 16 `TournamentPokemon` objects are its Standings. Each processed Battle calls `BattleRegister` on both Pokémon. Responses map them to the Standings DTO, so the `battleRecords` they accumulate are never serialized by the new endpoints.
- **Battle rules**: `BattleSimulator` and its rules are unchanged; `SimulateAllBattles` remains only for the Instant Simulation.

### Application service

- The new operations are new methods on `ITournamentService` / `TournamentService`: Start, Process Round, get Tournament, get Round, get Battle, and Tournament History. `GetTournamentStatistics` is untouched.
- **Start**:
  1. Fetch 16 Pokémon through `IPokemonApiClient`.
  2. Fail if fewer than 16 come back.
  3. Capitalize names.
  4. Create the Tournament, with its start time from an injected `TimeProvider`.
  5. Save it in the repository.
- **Process Round**: on a Tournament that is not Complete, compute and decide the next Round, register its Battles and append it.
- **Dependencies**: the service gains the repository and `TimeProvider`. `TimeProvider.System` is registered as a singleton.

### In-memory storage

- **Repository**: a new `ITournamentRepository` interface in the application layer, implemented by `InMemoryTournamentRepository` in the infrastructure layer.
  - Registered as a singleton, over a concurrent dictionary keyed by Tournament id.
  - Operations: add a Tournament, get one by id, and list all of them for the Tournament History.
- **No cleanup**: Tournaments are never removed and never expire. They live until the API restarts.
- **Locking**: each Tournament has its own lock, taken by Process Round and by every read of that Tournament (Tournament, Round, Battle).
  - Two simultaneous Process Round calls run one after the other: the second processes the following Round, or gets 409 if the first made the Tournament Complete.
  - Reads never see half-registered Battles.
- **Lifetimes**: the service stays scoped, `BattleSimulator` scoped, `IPokemonApiClient` a transient typed client, the repository a singleton. The repository depends on none of the others.

### PokéAPI cache

- **Store**: `PokemonApiClient` caches each Pokémon's PokéAPI data in a singleton `IMemoryCache`, keyed by Pokémon id.
  - It can't be a field on the client: the typed client is transient, so a field would not outlive one request.
  - Registering the memory cache is a new service registration.
- **What is cached**: an immutable snapshot per Pokémon: id, name, primary type, base experience and image URL.
- **Fresh objects**: every call builds new `TournamentPokemon` objects from the snapshots. `TournamentPokemon` is mutable, so sharing instances would leak one request's results into the next.
- **Failures**: a failed or null PokéAPI response is never cached.
- **Filling and expiry**: entries are filled on first use, with no preload at startup, and never expire. There are at most 151 of them; a restart clears them.
- **Scope**: the cache serves both Start and the Instant Simulation. The random draw and the data are unchanged, so the Instant Simulation's results and contract are identical. It just gets faster, and while PokéAPI is down a draw whose 16 ids are all cached now succeeds.

### Rate limiting

| Policy | Endpoints | Limit | Queue |
|---|---|---|---|
| `TournamentPolicy` | Instant Simulation `GET statistics` | 10 per minute | 5 (unchanged) |
| `StartTournamentPolicy` | Start | 10 per minute | 0 |
| `RoundByRoundPolicy` | Process Round and every new GET | 60 per minute | 0 |

- All three are fixed windows partitioned by client IP. Each policy has its own counters, so the flows never spend each other's budget.
- New actions declare their policy at action level, which overrides the controller-level `TournamentPolicy`.
- The 429 body stays empty for all three: no rejection handler is added.
- **Configuration**: the numbers move out of code into application configuration, `TournamentPolicy` included with its current values.
  - Section: `RateLimiting`, with one sub-section per policy, named after the policy.
  - Keys in each sub-section: `PermitLimit`, `WindowSeconds` and `QueueLimit`.
  - The window type and the partition stay in code.
- **No defaults in code**: a missing or invalid section makes the API fail at startup.

### Frontend: routes and navigation

- `/tournament` stays the Instant Simulation page, unchanged, and the `''` and `**` redirects still point to it.
- New routes:
  - `/round-by-round`: the Tournament History page, with Start Tournament.
  - `/round-by-round/:id`: the Tournament page.
- The app shell gets a small nav with "Instant Simulation" and "Round by Round".

### Frontend: Tournament History page

Layout (the ASCII sketch below comes from the frontend flow decision):

```
 Round by Round                                        [▶ Start Tournament]
 Tournament History
 ┌───────────────────┬──────────────┬────────┐
 │ Started           │ Rounds       │        │
 │ 28/10/2026 14:02  │ 15/15 ✔      │ [Open] │
 │ 28/10/2026 13:40  │ 7/15         │ [Open] │
 └───────────────────┴──────────────┴────────┘
 empty: "No Tournaments since the API last started."
```

- **Start Tournament**: calls Start, with a spinner on the button, then navigates to the new Tournament's page.
- **Open**: navigates to that Tournament.

### Frontend: Tournament page

Layout (the ASCII sketch below comes from the frontend flow decision):

```
 ← Tournament History
 Tournament · started 28/10 14:02            Round 3 of 15   [▶ Process Round]
 Rounds:  [1] [2] (3) [4·] [5·] … [15·]        · = not played yet, disabled
 ┌ Round 3 ─────────────────────────────────────────────────────┐
 │ Battle 17  ⚡ Pikachu 112   vs  💧 Squirtle 63    Pikachu wins │ ← click opens the Battle modal
 │ Battle 18  🪨 Onix 77       vs  🪨 Geodude 60     Onix wins    │
 │ Battle 19  🧠 Abra 62       vs  👻 Gastly 62      Tie          │
 │ … 8 rows                                                      │
 └──────────────────────────────────────────────────────────────┘
 Standings   Sort: [Wins ▼][Desc]
 ┌card┐ ┌card┐ ┌card┐ ┌card┐ …  16 PokemonCards
```

- **Loading**: the page always loads the Tournament, plus its last played Round when there is one. Coming from Start and reopening from the History take the same path.
- **Process Round**:
  - Shows the returned Round, selects its chip and updates the cards from the returned Standings.
  - Disabled with a spinner while a request is in flight.
  - Replaced by a "✔ Complete" badge once the Tournament is Complete.
- **Round chips**: clicking a played Round fetches it once and keeps it in the component, since played Rounds never change.
- **Standings**:
  - The cards always show the current Standings.
  - They reuse `SortControlsComponent` with local sorting, Wins descending by default.
  - `PokemonCardComponent` gets an optional input that hides "View Battles"; its default keeps the button, so the Instant Simulation is unchanged.
- **Battle modal**: fetches the Battle from the Battle endpoint and shows both Pokémon (image, type, base experience) and the winner, or "Tie".

### Frontend: service and models

- **Service**: a new `RoundByRoundService` with `startTournament`, `processRound`, `getTournament`, `getRound`, `getBattle` and `getHistory`.
- **Models**, one per file:
  - Tournament;
  - Round, and a processed Round that adds `standings`;
  - Battle, with its Battle Pokémon and `winnerId: number | null`;
  - Tournament History entry.
- **Standings entries**: reuse the existing `TournamentPokemon` model.
- **Base URL**: a shared `API_BASE_URL` constant (the API origin plus `/pokemon/tournament`), used by both `RoundByRoundService` and the Instant Simulation's `TournamentService`. That is a one-line change there, with no change in behaviour.

### Frontend: errors

- **Message**: a helper shared by the new pages uses the API's `error` field when the body has one. Otherwise it falls back to a fixed message by status, with the Instant Simulation's wording:
  - 0: unable to connect to the server;
  - 429: too many requests, wait a minute;
  - 500 and above: server error, try again later;
  - anything else: unexpected error.
- **Where it appears**:
  - **A page fails to load** (History list, Tournament page): an inline panel with the message and [Retry] replaces the content.
  - **An action fails** (Start, Process Round, Round chip): a toast like the Instant Simulation's, extracted into a new `ErrorToastComponent` (red, top right, hidden after 5 seconds). The page state doesn't change and the control is enabled again.
  - **The Battle modal fails**: the message appears inside the modal.
- **Any 404 on the Tournament page** replaces the page with:
  > This Tournament no longer exists. Tournaments are kept in memory only until the API restarts.

  with [Tournament History] and [Start Tournament] links.
- **A 409 on Process Round** (a stale second tab): reload the Tournament and its last Round, then show the API's message in a toast.
- The Instant Simulation keeps its own error handling and toast, unchanged.

### Documentation

- **README**: the new endpoints, the rate limits and their configuration, the PokéAPI cache, and the test counts.
- **`.claude/ARCHITECTURE.md`**:
  - The request flow now includes the repository and the cache. The line "nothing is persisted or cached" stops being true.
  - "Values that change together": the rate limits now live in configuration and the test constants, there are two new policies, and the API base URL is a shared frontend constant.
- **Glossary**: already updated with Complete and Start order.

## Testing Decisions

A good test exercises behaviour through a public seam and asserts what a caller can observe: HTTP status codes and bodies, returned values, rendered DOM, and requests sent to a faked boundary. It never asserts private state or how a result was computed. Fake only the boundaries named below; use the real `BattleSimulator`, `TournamentPokemon`, repository and other domain classes. Follow the coding standards:

- names follow `Method_ShouldOutcome_WhenCondition`;
- each test has a `<summary>` and `// Arrange` / `// Act` / `// Assert` comments;
- async tests are `async Task` and await their assertions;
- frontend specs call `httpMock.verify()` in `afterEach`.

### Seam 1: `TournamentService` (existing; prior art: the service validation tests)

- **Setup**: a faked `IPokemonApiClient`, `FakeTimeProvider` from `Microsoft.Extensions.TimeProvider.Testing` (a new test dependency), and the real repository and `BattleSimulator`.
- **Covers**:
  - Start returns 16 Pokémon at 0 wins, losses and ties.
  - Start fails and stores nothing when fewer than 16 Pokémon come back.
  - Over 15 Rounds every pair meets exactly once.
  - Every Round has each Pokémon exactly once.
  - Battle ids run 1–120 in play order.
  - `pokemon1` is the earlier Pokémon in the Start order.
  - Standings match the Battles.
  - Ties produce a null winner.
  - Process Round after Round 15 is rejected as Complete.
  - Unknown Tournament, Round and Battle are reported.
  - The History lists Tournaments newest first and includes unfinished ones.
  - Parallel Process Round calls produce consecutive Rounds with consistent Standings.
- **Existing tests**: the service's constructor gains dependencies, so the existing validation tests are adjusted to build it.

### Seam 2: `WebApplicationFactory<Program>` (existing; prior art: the rate-limiting tests)

- **Setup**: a faked `IPokemonApiClient`.
- **Covers**:
  - Every route's status code, `Location` header and JSON shape, including camelCase and `winnerId: null` on a tie.
  - `{ error }` bodies for 404, 409 and 502.
  - An empty 404 for a malformed id.
  - `history` not being captured as an id.
  - Each of the three policies rejecting with 429 at its own limit, with counters independent of each other.
  - The API failing to start when a rate-limit section is missing.
  - The Instant Simulation endpoint still answering as before.
- **Limits in tests**: they mirror the values in configuration, as the current test constants do.

### Seam 3 (new): `PokemonApiClient` with a stubbed `HttpMessageHandler`

The cache sits behind `IPokemonApiClient`, so this is the only seam that reaches it. It covers:

- fetching all 151 Pokémon twice sends exactly 151 requests to PokéAPI;
- changing the returned objects doesn't affect the next call;
- a failed response is not cached and is retried on the next call.

### Seam 4: routed pages (prior art: the Instant Simulation page spec, which uses DOM plus `HttpTestingController`)

- **Setup**: `RouterTestingHarness` with the app routes, `HttpTestingController` and the real `RoundByRoundService`.
- **Covers**:
  - The History page: list, empty state, Start navigating to the new Tournament, Open.
  - The Tournament page:
    - loading;
    - Process Round, including its disabled state while in flight and the Complete badge;
    - Round chips;
    - the Battle modal;
    - the sort controls;
    - no "View Battles" button.
  - Every error case: inline panel with Retry, toast, the message inside the modal, the "no longer exists" page and its links, and the reload on 409.
- **No separate service spec**: the pages' `expectOne(url, method)` already fix each request's URL and verb.
- **Existing specs**: they keep covering the Instant Simulation page and `PokemonCardComponent`'s default.

## Out of Scope

- A database or any persistence across API restarts: the assessment asks for in-memory only.
- Users, authentication, or a per-user Tournament History.
- Expiring or cleaning up Tournaments held in memory.
- Changes to the battle rules.
- Changes to the Instant Simulation's endpoint contract, results or page. The shared PokéAPI cache, the one-line base URL change and moving its rate-limit numbers to configuration keep its behaviour.
- Extras the assessment doesn't ask for: a Tournament leader, the reason a Battle was won, animations, a deep link to a single Battle.
- A rejection body or `Retry-After` header on 429 responses.
- Other performance work considered and rejected: a singleton `BattleSimulator`, a shorter `HttpClient` timeout, response compression.

## Further Notes

- Source of truth: `docs/assessment-v2.pdf`. Vocabulary: `GLOSSARY.md`.
- Each decision above, with its reasoning and the alternatives rejected, lives in a resolved ticket of the [Round-by-round Tournament map](map.md):
  - [New endpoints contract](issues/01-new-endpoints-contract.md)
  - [Rate limit for the new endpoints](issues/02-rate-limit-for-new-endpoints.md)
  - [Performance improvement worth adding](issues/03-performance-improvement.md)
  - [Tournament in memory](issues/04-tournament-in-memory.md)
  - [Round-by-round frontend flow](issues/05-frontend-flow.md)
  - [Error experience in the new views](issues/06-error-experience-in-new-views.md)
- Git: built on `feature/round-by-round-tournament`, one commit per implementation ticket, one PR to `main` at the end.
- Status: done. Tickets 07–13 are all done on `feature/round-by-round-tournament`; each ticket's Comments name its commit.
