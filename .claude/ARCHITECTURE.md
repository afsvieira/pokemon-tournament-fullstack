# Architecture

## API request flow

`TournamentController` → `ITournamentService` / `TournamentService` → `IPokemonApiClient` / `PokemonApiClient` (+ `IMemoryCache`) + `BattleSimulator` + `ITournamentRepository` / `InMemoryTournamentRepository` + `TimeProvider`.

- Instant Simulation (`GET statistics`): every request is a brand-new random tournament: 16 Kanto Pokémon (IDs 1–151), round-robin of 120 battles. Nothing about it is persisted, and the 16 ids are drawn at random on every call.
- Round-by-round Tournaments: Start stores a `Tournament` in the singleton `InMemoryTournamentRepository`, where it stays until the API restarts. Its start time comes from the injected `TimeProvider` (`TimeProvider.System`). The service returns DTO snapshots (`TournamentDto`), never the stored objects.
- The service reports each expected failure with its own exception, which the controller maps to a status with a generic `{ error }`; details go only to the log:
  - `PokemonUnavailableException` (PokéAPI failed or returned fewer than 16): 502.
  - `TournamentNotFoundException` (no Tournament under that id): 404. A malformed id never reaches the controller: the `{id:guid}` route constraint answers an empty 404.
- `PokemonApiClient` caches each Pokémon's PokéAPI data in the singleton `IMemoryCache`, keyed by id, as PokéAPI's fair use policy asks. Entries are immutable snapshots, filled on first use and never expired; failed or null responses are not cached. Every call builds fresh `TournamentPokemon` objects from them, because tournaments mutate those objects.
- Battles use only each Pokémon's primary type (PokéAPI slot 1).
- `sortBy`/`sortDirection` are validated twice: the controller answers 400 `{ error }` first; `TournamentService` throws `ArgumentException` as a second guard.
- PokéAPI is the only external boundary; everything behind `IPokemonApiClient` is ours.

## API–frontend contract

- JSON is camelCase and enums travel as strings (`JsonStringEnumConverter`), so the frontend `BattleOutcome` values equal the C# `BattleOutcomeEnum` names.
- The frontend re-sorts loaded results locally on sort change: a new API call would produce a different tournament.
- On the round-by-round Tournament page, any 404 (a `{ error }` body for an unknown id, an empty body for a malformed one) means the Tournament is gone: `handledAsTournamentGone` replaces the page with "This Tournament no longer exists". Every request that page makes routes its errors through it first.

## Values that change together

- API port `5268`: `Api/Properties/launchSettings.json`, `API_BASE_URL` in `frontend/src/app/services/api-base-url.ts`.
- API base URL (`API_BASE_URL`, the API origin plus `/pokemon/tournament`): used by both `TournamentService` and `RoundByRoundService`; it must match the controller's `[Route]`.
- Frontend origin `http://localhost:4200`: `AllowAngular` CORS policy in `Api/Program.cs`.
- Kanto id range 1–151: `PokemonApiClient.FetchRandomPokemonsAsync`, `KantoPokemonCount` in `Api.Tests/PokemonApiClientTests.cs`, README.
- Sort fields (`wins`, `losses`, `ties`, `name`, `id`): `TournamentController`, `TournamentService.SortPokemons`, frontend `SortBy` enum.
- Rate limits (rejections 429, empty body): the numbers live in configuration, one `RateLimiting` sub-section per policy in `Api/appsettings.json` (no defaults in code: the API fails at startup without them); also the constants in `Api.Tests/RateLimitingTests.cs`, README, and the 429 messages in `TournamentComponent.getErrorMessage` and `shared/error-message.ts`. Policy names are in `RateLimitPolicies`. The fixed window and per-IP partition stay in code (`AddFixedWindowRateLimitPolicy`).
  - `TournamentPolicy`, Instant Simulation: 10/minute, queue of 5.
  - `StartTournamentPolicy`, Start: 10/minute, no queue.
  - `RoundByRoundPolicy`, every round-by-round endpoint except Start (today `GET {id}`): 60/minute, no queue.
