# Pokémon Tournament

Pokémon from the Kanto region battle each other in a round-robin, decided by type advantage and base experience.

## Language

**Tournament**:
A round-robin between 16 Pokémon, held in memory under an id and processed one Round at a time.
_Avoid_: Bracket, season, competition

**Start order**:
The order in which a Tournament's 16 Pokémon were picked at Start; it fixes the Round pairings and the order of the Standings.
_Avoid_: Seed, draw order

**Round**:
One step of a Tournament: 8 Battles in which each of the 16 Pokémon fights exactly once. A Tournament has 15 Rounds.
_Avoid_: Stage, matchday

**Complete**:
A Tournament whose 15 Rounds have all been processed.
_Avoid_: Finished, over, ended

**Battle**:
One fight between two Pokémon, decided by the battle rules; it ends in a win, a loss or a tie.
_Avoid_: Match, game, duel

**Standings**:
Each Pokémon's wins, losses and ties so far in a Tournament.
_Avoid_: Ranking, leaderboard, table

**Position**:
Where a Pokémon stands in the Standings by the default order: most wins, then fewest losses, then name. Pokémon with equal wins, losses and ties share one Position and the next one skips.
_Avoid_: Rank, place, seed

**Win rate**:
The share of a Pokémon's Battles it has won, as a percentage; it rises and falls with the Standings.
_Avoid_: Win percentage, success rate

**Movement**:
The change of a Pokémon's Position since the last Round processed on the page: Positions gained, lost, or none.
_Avoid_: Rank change, climb, drop

**Tournament History**:
The Tournaments started since the API last started.
_Avoid_: Archive, log

**Instant Simulation**:
The original flow: all 120 Battles of 16 random Pokémon computed in one request, never stored and never part of the Tournament History.
_Avoid_: Tournament (for this flow), quick tournament
