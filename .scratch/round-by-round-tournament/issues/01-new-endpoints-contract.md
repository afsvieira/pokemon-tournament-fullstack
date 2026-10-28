# New endpoints contract

Type: grilling
Status: resolved
Map: [Round-by-round Tournament](../map.md)

## Question

What API surface does the round-by-round flow need, and what does each endpoint take and return?

The PDF fixes four endpoints: start a Tournament (returns its id and the 16 Pokémon), process the next Round (returns its 8 Battle results and the updated Standings), `GET /pokemon/tournament/{id}/battles/{battleId}` (one Battle, for review) and `GET /pokemon/tournament/history` (the Tournament History). Decide:

- Routes and HTTP verbs for Start and Process Round.
- Which extra endpoints the flow needs, if any, to review an earlier Round or to reopen a Tournament picked from the Tournament History.
- The id formats for a Tournament and a Battle.
- Payload shapes: Pokémon, Battle result, Standings, Tournament History entry.
- Errors: unknown Tournament or Battle, Process Round after Round 15, PokéAPI failing on Start (or returning fewer than 16 Pokémon: `PokemonApiClient` skips null responses).

All new routes sit under `pokemon/tournament`, next to `GET statistics` on `TournamentController`; `history` must not be captured by `{id}`.

## Answer

### Routes

All on `TournamentController` under `pokemon/tournament`; the Instant Simulation's `GET statistics` is unchanged. Literal segments (`history`, `statistics`) win over `{id}` in ASP.NET routing, and the `guid` constraint makes that explicit.

| Verb | Route | Success | Body |
|---|---|---|---|
| POST | `/pokemon/tournament` | 201, `Location: /pokemon/tournament/{id}` | Tournament |
| POST | `/pokemon/tournament/{id:guid}/rounds` | 201, `Location: /pokemon/tournament/{id}/rounds/{roundNumber}` | `{ roundNumber, battles[8], standings[16] }` |
| GET | `/pokemon/tournament/{id:guid}` | 200 | Tournament |
| GET | `/pokemon/tournament/{id:guid}/rounds/{roundNumber:int}` | 200 | `{ roundNumber, battles[8] }` |
| GET | `/pokemon/tournament/{id:guid}/battles/{battleId:int}` | 200 | Battle |
| GET | `/pokemon/tournament/history` | 200 | Tournament History entries |

- Start and Process Round take no request body. The API, not the client, picks the next Round and its pairs.
- `GET {id}` reopens a Tournament picked from the Tournament History; `GET {id}/rounds/{roundNumber}` reviews an earlier Round.
- Process Round uses the REST collection form (`POST …/rounds`), not `…/rounds/next`.

### Ids

- Tournament: `Guid`. An int id kept from before an API restart would silently open a different Tournament after it; a Guid cannot.
- Round: `roundNumber`, 1–15.
- Battle: int 1–120, scoped to its Tournament, numbered in play order: Round r holds Battles 8(r−1)+1 … 8r.

### Payloads

JSON camelCase, as today.

- **Tournament**: `{ id, startedAt, roundsPlayed, standings[16] }`. `startedAt` is UTC ISO 8601. At Start, `standings` is the 16 selected Pokémon, all at 0 wins, losses and ties.
- **Standings entry**: `{ id, name, type, baseExperience, imageUrl, wins, losses, ties, winRate }`, the Instant Simulation's `TournamentPokemon` without `battleRecords`, so the frontend can reuse its model and `PokemonCardComponent`. Always in Start order; the API never re-sorts Standings (ranking is presentation).
- **Battle**: `{ id, roundNumber, pokemon1, pokemon2, winnerId }`, the same shape in Process Round, the Round GET and the Battle GET.
  - `pokemon1`, `pokemon2`: `{ id, name, type, baseExperience, imageUrl }`, with no wins, losses or ties: a past Battle would show the wrong record.
  - `winnerId`: the winning Pokémon's id, `null` on a tie. `BattleOutcomeEnum` was rejected because Win/Loss/Tie is one Pokémon's view, and a Battle has two sides.
- **Tournament History entry**: `{ id, startedAt, roundsPlayed }`. Newest first, includes Tournaments that are not Complete, no paging. A Tournament is Complete when `roundsPlayed == 15`.
- Pokémon names are capitalized with `StringHelper.Capitalize`, as in the Instant Simulation.

### Errors

Expected failures answer `{ error: "<message>" }` with a fixed, generic message. Exception text, PokéAPI URLs or status codes and stack traces never reach the client; details go to the log only.

| Case | Status | `error` |
|---|---|---|
| Well-formed Tournament id not held in memory | 404 | `Tournament not found.` |
| Round outside 1–15, or not yet played | 404 | `Round not found.` |
| Battle outside 1–120, or not yet played | 404 | `Battle not found.` |
| Malformed id (not a Guid or not an int) | 404, empty body | none: no route matches |
| Process Round on a Complete Tournament | 409 | `Tournament is already complete.` |
| PokéAPI fails on Start, or returns fewer than 16 Pokémon | 502 | `Could not start a tournament right now. Try again later.` |
| Anything unexpected | 500 | unchanged: `Problem("An unexpected error occurred")` |

When Start fails, no Tournament is created and nothing reaches the Tournament History. Missing Pokémon are not re-fetched.

### Left to other tickets

- Rate limit on these routes: [Rate limit for the new endpoints](02-rate-limit-for-new-endpoints.md).
- Concurrent Process Round calls, and which Pokémon of a pair is `pokemon1`: [Tournament in memory](04-tournament-in-memory.md).

Glossary: added **Complete**.
