# Architecture

## API request flow

`TournamentController` → `ITournamentService` / `TournamentService` → `IPokemonApiClient` / `PokemonApiClient` + `BattleSimulator`.

- Every request is a brand-new random tournament: 16 Kanto Pokémon (IDs 1–151), round-robin of 120 battles. Nothing is persisted or cached, so two calls never return the same set.
- Battles use only each Pokémon's primary type (PokéAPI slot 1).
- `sortBy`/`sortDirection` are validated twice: the controller answers 400 `{ error }` first; `TournamentService` throws `ArgumentException` as a second guard.
- PokéAPI is the only external boundary; everything behind `IPokemonApiClient` is ours.

## API–frontend contract

- JSON is camelCase and enums travel as strings (`JsonStringEnumConverter`), so the frontend `BattleOutcome` values equal the C# `BattleOutcomeEnum` names.
- The frontend re-sorts loaded results locally on sort change: a new API call would produce a different tournament.

## Values that change together

- API port `5268`: `Api/Properties/launchSettings.json`, `frontend/src/app/services/tournament.service.ts`.
- Frontend origin `http://localhost:4200`: `AllowAngular` CORS policy in `Api/Program.cs`.
- Sort fields (`wins`, `losses`, `ties`, `name`, `id`): `TournamentController`, `TournamentService.SortPokemons`, frontend `SortBy` enum.
- Rate limit (10 requests/minute per IP, queue of 5, rejections 429): `TournamentPolicy` in `Api/Program.cs`, constants in `Api.Tests/RateLimitingTests.cs`, README, 429 message in `TournamentComponent.getErrorMessage`.
