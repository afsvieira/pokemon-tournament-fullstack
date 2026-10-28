# 11: Process Rounds to the end

**Spec:** [Round-by-round Tournament](../spec.md)

**What to build:** On a Tournament's page, the user presses Process Round to resolve the next of the 15 Rounds. Each press shows which Pokémon fought, who won each of the 8 Battles and the updated Standings, until the Tournament is Complete. Reopening or refreshing the page shows the last played Round.

**Blocked by:** 10 (A Tournament that no longer exists).

**Status:** ready-for-agent

**API**

- [ ] `POST /pokemon/tournament/{id:guid}/rounds` takes no body and answers 201 with `Location: /pokemon/tournament/{id}/rounds/{roundNumber}` and `{ roundNumber, battles, standings }`: 8 Battles and 16 Standings entries.
- [ ] A Battle is `{ id, roundNumber, pokemon1, pokemon2, winnerId }`:
  - `pokemon1` and `pokemon2` are `{ id, name, type, baseExperience, imageUrl }`.
  - `winnerId` is the winner's Pokémon id, or `null` on a tie.
- [ ] Rounds are paired with the circle method over the Start order: the first Pokémon stays fixed and the other 15 rotate one position per Round.
- [ ] Round r is computed only when it is processed, and `BattleSimulator.DetermineBattleOutcome` decides each of its Battles. Nothing about future Rounds is stored.
- [ ] In each Battle, `pokemon1` is whichever Pokémon comes first in the Start order.
- [ ] A Round's Battles keep circle-method order and take the ids 8(r−1)+1 … 8r.
- [ ] Each Battle calls `BattleRegister` on both Pokémon, so the Standings and `roundsPlayed` update.
- [ ] Process Round on a Complete Tournament answers 409 `{ "error": "Tournament is already complete." }`. On an unknown Tournament it answers 404 `{ "error": "Tournament not found." }`.
- [ ] `GET /pokemon/tournament/{id:guid}/rounds/{roundNumber:int}` answers 200 with `{ roundNumber, battles }`. A Round outside 1–15 or not yet played answers 404 `{ "error": "Round not found." }`.
- [ ] Each Tournament has its own lock, taken by Process Round and by every read of that Tournament. Simultaneous Process Round calls run one after another and never duplicate or skip a Round number.
- [ ] Both routes use `RoundByRoundPolicy`.

**UI**

- [ ] The Process Round button is disabled, with a spinner, while a request is in flight. Once the Tournament is Complete, a "✔ Complete" badge replaces it.
- [ ] After a Round is processed:
  - The Round panel lists its 8 Battles: "Battle n", then both Pokémon with type icon, name and base experience, then "<name> wins" or "Tie".
  - The header reads "Round r of 15".
  - The cards update from the returned Standings.
- [ ] Loading the page also loads the last played Round, when there is one.
- [ ] A failed Process Round shows a toast, leaves the page unchanged and enables the button again.
- [ ] A 404 shows the "no longer exists" page.
- [ ] A 409 reloads the Tournament and its last Round, then shows the API's message in a toast.
- [ ] `RoundByRoundService` gains `processRound` and `getRound`. Round, processed Round and Battle get their own model files.

**Tests and docs**

- [ ] Service seam:
  - After 15 Rounds, every pair has met exactly once, and each Pokémon has fought once per Round.
  - Battle ids run 1–120 in play order, and `pokemon1` follows the Start-order rule.
  - The Standings match the Battles, and a tie has a null winner.
  - Process Round on a Complete Tournament is rejected.
  - Parallel Process Round calls produce consecutive Rounds with consistent Standings.
- [ ] HTTP seam:
  - Process Round's 201, `Location` and JSON shape, including `winnerId: null` on a tie.
  - The 409 body.
  - The Round GET's 200 and 404.
- [ ] Routed-pages seam:
  - Process Round renders the Round and updates the cards.
  - The button is disabled while a request is in flight, and the Complete badge appears after Round 15.
  - Loading the page shows the last Round.
  - A failed Process Round shows a toast, a 409 reloads the page and shows a toast, and a 404 shows the "no longer exists" page.
- [ ] The README documents Process Round and the Round GET.
