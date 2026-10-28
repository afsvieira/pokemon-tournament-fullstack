# New endpoints contract

Type: grilling
Status: open
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
