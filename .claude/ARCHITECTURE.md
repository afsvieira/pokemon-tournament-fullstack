# Architecture

## API request flow

`TournamentController` → `ITournamentService` / `TournamentService` → `IPokemonApiClient` / `PokemonApiClient` (+ `IMemoryCache`) + `BattleSimulator`.

- Every request is a brand-new random tournament: 16 Kanto Pokémon (IDs 1–151), round-robin of 120 battles. Nothing about a tournament is persisted, and the 16 ids are drawn at random on every call.
- `PokemonApiClient` caches each Pokémon's PokéAPI data in the singleton `IMemoryCache`, keyed by id, as PokéAPI's fair use policy asks. Entries are immutable snapshots, filled on first use and never expired; failed or null responses are not cached. Every call builds fresh `TournamentPokemon` objects from them, because tournaments mutate those objects.
- Battles use only each Pokémon's primary type (PokéAPI slot 1).
- `sortBy`/`sortDirection` are validated twice: the controller answers 400 `{ error }` first; `TournamentService` throws `ArgumentException` as a second guard.
- PokéAPI is the only external boundary; everything behind `IPokemonApiClient` is ours.

## API–frontend contract

- JSON is camelCase and enums travel as strings (`JsonStringEnumConverter`), so the frontend `BattleOutcome` values equal the C# `BattleOutcomeEnum` names.
- The frontend re-sorts loaded results locally on sort change: a new API call would produce a different tournament.

## Values that change together

- API port `5268`: `Api/Properties/launchSettings.json`, `frontend/src/app/services/tournament.service.ts`.
- Frontend origin `http://localhost:4200`: `AllowAngular` CORS policy in `Api/Program.cs`.
- Kanto id range 1–151: `PokemonApiClient.FetchRandomPokemonsAsync`, `KantoPokemonCount` in `Api.Tests/PokemonApiClientTests.cs`, README.
- Sort fields (`wins`, `losses`, `ties`, `name`, `id`): `TournamentController`, `TournamentService.SortPokemons`, frontend `SortBy` enum.
- Rate limit (10 requests/minute per IP, queue of 5, rejections 429): the numbers live in configuration, `RateLimiting:TournamentPolicy` in `Api/appsettings.json` (no defaults in code: the API fails at startup without them); also the constants in `Api.Tests/RateLimitingTests.cs`, README, 429 message in `TournamentComponent.getErrorMessage`. The fixed window and per-IP partition stay in code (`AddFixedWindowRateLimitPolicy`).
