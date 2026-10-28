# Pokémon Tournament

Pokémon from the Kanto region battle each other in a round-robin, decided by type advantage and base experience.

## Language

**Tournament**:
A round-robin between 16 Pokémon, held in memory under an id and processed one Round at a time.
_Avoid_: Bracket, season, competition

**Round**:
One step of a Tournament: 8 Battles in which each of the 16 Pokémon fights exactly once. A Tournament has 15 Rounds.
_Avoid_: Stage, matchday

**Battle**:
One fight between two Pokémon, decided by the battle rules; it ends in a win, a loss or a tie.
_Avoid_: Match, game, duel

**Standings**:
Each Pokémon's wins, losses and ties so far in a Tournament.
_Avoid_: Ranking, leaderboard, table

**Tournament History**:
The Tournaments started since the API last started.
_Avoid_: Archive, log

**Instant Simulation**:
The original flow: all 120 Battles of 16 random Pokémon computed in one request, never stored and never part of the Tournament History.
_Avoid_: Tournament (for this flow), quick tournament
