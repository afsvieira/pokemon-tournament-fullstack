# Performance improvement worth adding

Type: grilling
Status: resolved
Map: [Round-by-round Tournament](../map.md)

## Question

Is there a cheap performance improvement worth adding with this feature, and if so which one?

Starting a Tournament fetches 16 random Pokémon from PokéAPI, as the Instant Simulation does: `PokemonApiClient.FetchRandomPokemonsAsync` picks 16 ids out of 1–151 and calls `GET pokemon/{id}` for each, in parallel. Candidates include caching PokéAPI responses in memory. "None" is a valid answer.

Any change must leave the Instant Simulation's results, contract and behaviour unchanged.

## Answer

Add one improvement: an in-memory cache of PokéAPI responses, keyed by Pokémon id.

### Why

- PokéAPI's Fair Use Policy (https://pokeapi.co/docs/v2) asks: "Locally cache resources whenever you request them." Clients that ignore the policy risk a permanent IP ban.
- Kanto Pokémon data (ids 1–151) is static. Today every Start and every Instant Simulation makes 16 PokéAPI requests; with the cache, the API makes at most 151 PokéAPI requests in total since it started.

### How

- **Store**: a singleton `IMemoryCache`, keyed by Pokémon id. It must not be a field on `PokemonApiClient`: `AddHttpClient<IPokemonApiClient, PokemonApiClient>` registers the client as transient, so a field would not outlive one request.
- **What is cached**: an immutable snapshot of each Pokémon: id, name, primary type, base experience and image URL.
- **Fresh objects per request**: every request builds new `TournamentPokemon` objects from the snapshots. `TournamentPokemon` is mutable: `BattleSimulator` adds wins, losses, ties and `BattleRecords`, and `TournamentService` capitalizes `Name` in place. Sharing instances would leak one request's results into the next.
- **Failures**: a failed or null PokéAPI response is never cached.
- **Filling and expiry**: entries are fetched on first use, with no preload at startup, so startup never depends on PokéAPI. Entries never expire: the data is static, there are at most 151 entries, and an API restart clears them.
- **Scope**: one cache inside `PokemonApiClient`, used by both Start and the Instant Simulation.

### Effect on the Instant Simulation

Its results and contract are unchanged: the 16 ids are still drawn at random and the data behind them is the same. It just gets faster and makes fewer PokéAPI calls. One visible difference: while PokéAPI is down, an Instant Simulation or a Start whose 16 ids are all cached now succeeds, where before it always failed.

### Rejected

- `BattleSimulator` as a singleton: no measurable gain.
- A shorter `HttpClient` timeout: that is resilience, not performance, and it would change how the Instant Simulation behaves.
- Response compression: the payloads are small, and it would change the Instant Simulation's response headers.

### Rate limit for Start

[Rate limit for the new endpoints](02-rate-limit-for-new-endpoints.md) stays as decided. With the cache, Start barely costs PokéAPI anything any more, but every Start still creates a Tournament that never expires, and that alone justifies 10 per minute.
