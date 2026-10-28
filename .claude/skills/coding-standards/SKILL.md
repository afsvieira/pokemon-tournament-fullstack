---
name: coding-standards
description: Coding standards for this repo's C# API, its tests and the Angular frontend. Use before writing code, reviewing changes, or answering questions about conventions.
---

# Coding standards

## C# (`Api/`, `Api.Tests/`)

- Public types and members carry XML doc comments (`<summary>`, `<param>`), on interfaces and on their implementations.
- Interfaces live in `Api/Application/Interface/` under the `Api.Application` namespace; implementations of external boundaries live in `Api/Infrastructure/`.
- External HTTP clients are typed clients registered against their interface: `AddHttpClient<IPokemonApiClient, PokemonApiClient>()`.

## Tests

- Fake only the PokéAPI boundary (`IPokemonApiClient`); use the real `BattleSimulator`, `TournamentPokemon` and other domain classes.
- Test service behaviour through `TournamentService`; test middleware, routing and status codes through `WebApplicationFactory<Program>` (see `RateLimitingTests`).
- Test `PokemonApiClient` itself, and its cache, with the real client over a stubbed `HttpMessageHandler` (see `PokemonApiClientTests`): the one place the fake sits below `IPokemonApiClient`.
- Async tests are `async Task` and await every assertion (`await Assert.ThrowsAsync<...>`).
- Name tests `Method_ShouldOutcome_WhenCondition`, each with a `<summary>` and `// Arrange` / `// Act` / `// Assert` comments.
- Frontend: test components through the rendered DOM with the real service and `HttpTestingController`, calling `httpMock.verify()` in `afterEach`.

## Angular (`frontend/`)

- Standalone components with the built-in control flow (`@if`, `@for`).
- Import each model from its own file in `models/`.
- Presentation logic lives in component getters and methods; templates only bind (see `BattleHistoryModalComponent.pokemonRecords`).
- 2-space indentation and single quotes (`frontend/.editorconfig`).

## Commits

Conventional Commits (`feat:`, `fix:`, `refactor(scope):`, `test:`, `docs:`, `chore:`), with `Closes #N` in the body when the commit finishes an issue.
