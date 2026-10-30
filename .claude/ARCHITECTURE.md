# Architecture

## API request flow

`TournamentController` → `ITournamentService` / `TournamentService` → `IPokemonApiClient` / `PokemonApiClient` (+ `IMemoryCache`) + `BattleSimulator` + `ITournamentRepository` / `InMemoryTournamentRepository` + `TimeProvider`.

- Instant Simulation (`GET statistics`): every request is a brand-new random tournament: 16 Kanto Pokémon (IDs 1–151), round-robin of 120 battles. Nothing about it is persisted, and the 16 ids are drawn at random on every call.
- Round-by-round Tournaments: Start stores a `Tournament` in the singleton `InMemoryTournamentRepository`, where it stays until the API restarts. Its start time comes from the injected `TimeProvider` (`TimeProvider.System`). The service returns DTO snapshots (`TournamentDto`, `ProcessedRoundDto`, `RoundDto`, `BattleDto`, `TournamentHistoryEntryDto`), never the stored objects.
- Process Round: `Tournament.PlayNextRound` pairs Round r with the circle method over the Start order (first Pokémon fixed, the other 15 rotating), decides each Battle with `BattleSimulator.DetermineBattleOutcome` and calls `BattleRegister` on both Pokémon, so the Tournament's `TournamentPokemon` objects are its Standings. Nothing about later Rounds is stored. `SimulateAllBattles` stays with the Instant Simulation.
- Locking: each `Tournament` has its own `SyncRoot`. The service holds it while processing a Round and while reading a Tournament, Round or Battle (the Tournament History takes each Tournament's lock in turn), mapping to DTOs inside the lock, so simultaneous Process Round calls run one after another and reads never see a half-registered Battle.
- The service reports each expected failure with its own exception, which the controller maps to a status with a generic `{ error }`; details go only to the log:
  - `PokemonUnavailableException` (PokéAPI failed or returned fewer than 16): 502.
  - `TournamentNotFoundException` (no Tournament under that id): 404. A malformed id never reaches the controller: the `{id:guid}` route constraint answers an empty 404.
  - `TournamentCompleteException` (Process Round after Round 15): 409.
  - `RoundNotFoundException` (a Round outside 1–15 or not played yet): 404.
  - `BattleNotFoundException` (a Battle outside 1–120 or not played yet): 404.
- `PokemonApiClient` caches each Pokémon's PokéAPI data in the singleton `IMemoryCache`, keyed by id, as PokéAPI's fair use policy asks. Entries are immutable snapshots, filled on first use and never expired; failed or null responses are not cached. Every call builds fresh `TournamentPokemon` objects from them, because tournaments mutate those objects.
- Battles use only each Pokémon's primary type (PokéAPI slot 1).
- `sortBy`/`sortDirection` are validated twice: the controller answers 400 `{ error }` first; `TournamentService` throws `ArgumentException` as a second guard.
- PokéAPI is the only external boundary; everything behind `IPokemonApiClient` is ours.

## API–frontend contract

- JSON is camelCase and enums travel as strings (`JsonStringEnumConverter`), so the frontend `BattleOutcome` values equal the C# `BattleOutcomeEnum` names.
- The frontend re-sorts loaded results locally on sort change: a new API call would produce a different tournament.
- On the round-by-round Tournament page, any 404 (a `{ error }` body for an unknown id, an empty body for a malformed one) means the Tournament is gone: `handledAsTournamentGone` replaces the page with "This Tournament no longer exists". Every request that page makes routes its errors through it first; the Battle modal, which fetches its own Battle, emits `(tournamentGone)` on a 404 instead, and the page answers with the same "no longer exists" view.
- A 409 on Process Round means another client completed the Tournament: the page reloads the Tournament and its last Round, then shows the API's message in a toast.

## Values that change together

- API port `5268`: `Api/Properties/launchSettings.json`, `API_BASE_URL` in `frontend/src/app/services/api-base-url.ts`.
- API base URL (`API_BASE_URL`, the API origin plus `/pokemon/tournament`): used by both `TournamentService` and `RoundByRoundService`; it must match the controller's `[Route]`.
- Frontend origin `http://localhost:4200`: `AllowAngular` CORS policy in `Api/Program.cs`.
- Rounds per Tournament (15, from 16 Pokémon; 8 Battles each, 120 in all): `Tournament.RoundCount` and `BattlesPerRound`, `ROUND_COUNT` in `frontend/src/app/models/tournament.model.ts` (both round-by-round pages), the README, and the literal 15/8/120 expectations in `RoundByRoundServiceTests`, `RoundByRoundEndpointsTests` and the frontend test data (`testing/test-tournament.ts`).
- Kanto id range 1–151: `PokemonApiClient.FetchRandomPokemonsAsync`, `KantoPokemonCount` in `Api.Tests/PokemonApiClientTests.cs`, README.
- Sort fields (`wins`, `losses`, `ties`, `name`, `id`): `TournamentController`, `TournamentService.SortPokemons`, frontend `SortBy` enum, the Standings headers in `StandingsComponent` (round-by-round page) and `SortControlsComponent` (Instant Simulation). The Pokémon card and the sort controls belong to the Instant Simulation only; the round-by-round page shows the Standings as rows with a Position computed in `shared/standings.ts` (`positionStandings`).
- Rate limits (rejections 429, empty body): the numbers live in configuration, one `RateLimiting` sub-section per policy in `Api/appsettings.json` (no defaults in code: the API fails at startup without them); also the constants in `Api.Tests/RateLimitingTests.cs`, README, and the 429 messages in `TournamentComponent.getErrorMessage` and `shared/error-message.ts`; the window's length is also `RATE_LIMIT_WINDOW_SECONDS` in `frontend/src/app/shared/rate-limit.ts`, which the round-by-round page counts down after a 429 instead of asking for `Retry-After`. Policy names are in `RateLimitPolicies`. The fixed window and per-IP partition stay in code (`AddFixedWindowRateLimitPolicy`).
  - `TournamentPolicy`, Instant Simulation: 10/minute, queue of 5.
  - `StartTournamentPolicy`, Start: 10/minute, no queue.
  - `RoundByRoundPolicy`, every round-by-round endpoint except Start (Process Round, the Tournament History and the Tournament, Round and Battle GETs): 60/minute, no queue.
