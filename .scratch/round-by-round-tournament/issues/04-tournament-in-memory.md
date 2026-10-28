# Tournament in memory

Type: grilling
Status: open
Blocked by: 01
Map: [Round-by-round Tournament](../map.md)

## Question

How is a Tournament held in memory so that any Round or Battle can be fetched back for review?

- How the 15 Rounds are scheduled so every pair of the 16 Pokémon meets exactly once (8 Battles per Round, 120 in total), and whether the schedule is fixed at Start or built Round by Round.
- What is stored per Tournament, Round and Battle, and how the Battle ids chosen in [New endpoints contract](01-new-endpoints-contract.md) map onto it.
- How much of `BattleSimulator` and `TournamentPokemon` is reused.
- What happens when two Process Round calls for the same Tournament arrive at the same time.
