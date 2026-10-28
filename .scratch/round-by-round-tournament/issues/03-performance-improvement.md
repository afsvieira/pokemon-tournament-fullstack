# Performance improvement worth adding

Type: grilling
Status: open
Map: [Round-by-round Tournament](../map.md)

## Question

Is there a cheap performance improvement worth adding with this feature, and if so which one?

Starting a Tournament fetches 16 random Pokémon from PokéAPI, as the Instant Simulation does: `PokemonApiClient.FetchRandomPokemonsAsync` picks 16 ids out of 1–151 and calls `GET pokemon/{id}` for each, in parallel. Candidates include caching PokéAPI responses in memory. "None" is a valid answer.

Any change must leave the Instant Simulation's results, contract and behaviour unchanged.
