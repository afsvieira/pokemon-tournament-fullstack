# 08: PokéAPI cache

**Spec:** [Round-by-round Tournament](../spec.md)

**What to build:** PokéAPI responses are cached in memory by Pokémon id, so after warm-up the Instant Simulation (and later Start) stop calling PokéAPI for Pokémon already seen. Results stay identical. The API then follows PokéAPI's fair use policy ("Locally cache resources whenever you request them").

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `PokemonApiClient` keeps each Pokémon's data in a singleton memory cache keyed by Pokémon id. The cache is registered in DI, not held in a field of the transient typed client.
- [ ] Each cache entry is an immutable snapshot: id, name, primary type, base experience and image URL.
- [ ] Every call builds fresh `TournamentPokemon` objects from the snapshots. Changing the returned objects never affects a later call.
- [ ] A failed or null PokéAPI response is never cached.
- [ ] Entries are filled on first use, with no preload at startup, and never expire.
- [ ] The Instant Simulation's contract and results are unchanged; its 16 ids are still drawn at random.
- [ ] Tests at a new seam, `PokemonApiClient` with a stubbed HTTP message handler:
  - Fetching all 151 Pokémon twice sends exactly 151 requests to PokéAPI.
  - Changing the returned objects doesn't leak into the next call.
  - A failed response isn't cached and is requested again on the next call.
- [ ] The request flow in `.claude/ARCHITECTURE.md` mentions the cache, and its claim that nothing is cached is corrected. The README mentions the cache.
