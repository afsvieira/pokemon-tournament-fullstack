# Tournament in memory

Type: grilling
Status: resolved
Blocked by: 01
Map: [Round-by-round Tournament](../map.md)

## Question

How is a Tournament held in memory so that any Round or Battle can be fetched back for review?

- How the 15 Rounds are scheduled so every pair of the 16 Pokémon meets exactly once (8 Battles per Round, 120 in total), and whether the schedule is fixed at Start or built Round by Round.
- What is stored per Tournament, Round and Battle, and how the Battle ids chosen in [New endpoints contract](01-new-endpoints-contract.md) map onto it.
- How much of `BattleSimulator` and `TournamentPokemon` is reused.
- Which Pokémon of a pair is `pokemon1` in a Battle.
- What happens when two Process Round calls for the same Tournament arrive at the same time.

## Answer

### Schedule

- Rounds are paired with the circle method over the Start order: the first Pokémon stays fixed and the other 15 rotate one position each Round. That yields 15 Rounds of 8 Battles, with every pair meeting exactly once.
- Round r's pairs are a pure function of r and the Start order. They are computed only when Round r is processed, and `BattleSimulator.DetermineBattleOutcome` decides each Battle at that moment. Nothing about future Rounds is stored. The schedule is still fixed at Start, because it is deterministic.
- Rejected: computing all 120 Battles at Start and revealing them one Round at a time. The results would be identical, since the rules are deterministic, but Process Round would only reveal results instead of resolving them.

### Battles

- In each pair, `pokemon1` is whichever Pokémon comes first in the Start order. The battle rules are symmetric, so this only affects display.
- A Round's Battles keep circle-method order and take the ids 8(r−1)+1 … 8r, as fixed in [New endpoints contract](01-new-endpoints-contract.md).

### What is stored

- **Store**: `ITournamentRepository` in `Api/Application/Interface/`, implemented by `InMemoryTournamentRepository` in `Api/Infrastructure/`, registered as a singleton over a `ConcurrentDictionary<Guid, Tournament>`. The Tournament History is its values, newest first.
- **Tournament**: `Id`, `StartedAt`, the 16 Pokémon as `TournamentPokemon` in Start order, and the played Rounds.
- **Round**: its number and its 8 Battles.
- **Battle**: `Id`, `RoundNumber`, `Pokemon1Id`, `Pokemon2Id` and `WinnerId` (null on a tie). The Pokémon summaries in Battle responses are built from the Tournament's Pokémon.
- **Pokémon objects**: each Start builds fresh `TournamentPokemon` objects from the PokéAPI cache snapshots ([Performance improvement worth adding](03-performance-improvement.md)), so no two Tournaments share an instance.
- **Start time**: `StartedAt` comes from an injected `TimeProvider`, registered as `TimeProvider.System`, so tests control the clock and the History order.

### Reuse

- **Standings**: the stored `TournamentPokemon` objects are the Standings. Each processed Battle calls `BattleRegister` on both Pokémon, updating wins, losses and ties; `WinRate` comes free. Responses map them to the Standings DTO, which has no `battleRecords`.
- **Battle rules**: `BattleSimulator.DetermineBattleOutcome` decides every Battle. `SimulateAllBattles` stays with the Instant Simulation.
- **Service**: the new operations (Start, Process Round, get Tournament, get Round, get Battle, Tournament History) are new methods on `ITournamentService` / `TournamentService`, beside the untouched `GetTournamentStatistics`. That follows the coding standard of testing service behaviour through `TournamentService`.
- **Lifetimes**: the scoped service uses the scoped `BattleSimulator`, the transient `IPokemonApiClient` and the singleton repository. The repository depends on neither.

### Concurrency

- Each Tournament has its own lock, taken by Process Round and by every read of that Tournament (Tournament, Round, Battle). Without it, a read could see a Battle registered for one Pokémon but not yet for the other.
- When two Process Round calls arrive together, the second waits, then processes the next Round, or answers 409 if the first one made the Tournament Complete. Round numbers are never duplicated or skipped.
- Preventing a double click is the frontend's job: disable the button while a request is in flight.
- Rejected: the second call answering 409 "in progress" through a try-lock.

Glossary: added **Start order**.
