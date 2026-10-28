# 12: Review earlier Rounds and Battles

**Spec:** [Round-by-round Tournament](../spec.md)

**What to build:** On a Tournament's page, the user can go back to any played Round with a row of Round chips, and open any single Battle in a modal that shows both Pokémon and the result.

**Blocked by:** 11 (Process Rounds to the end).

**Status:** ready-for-agent

**API**

- [x] `GET /pokemon/tournament/{id:guid}/battles/{battleId:int}` answers 200 with the Battle.
- [x] A Battle outside 1–120, or not yet played, answers 404 `{ "error": "Battle not found." }`. An unknown Tournament answers 404 `{ "error": "Tournament not found." }`.
- [x] The route uses `RoundByRoundPolicy` and reads under the Tournament's lock.

**UI**

- [x] The page shows one chip per Round, 1–15:
  - Played Rounds are clickable, and the selected one is highlighted.
  - Rounds not yet played are disabled.
  - After Process Round, the newest Round is selected.
- [x] Clicking an earlier Round fetches it once, keeps it in the component and shows it in the Round panel. The cards keep showing the current Standings.
- [x] A failed chip fetch shows a toast, and the previously selected Round stays selected.
- [x] Clicking a Battle row opens a modal that fetches the Battle and shows both Pokémon (image, type, base experience) and the winner, or "Tie".
- [x] When the modal's fetch fails, the message appears inside the modal, which keeps its close button. A 404 shows the "no longer exists" page.
- [x] `RoundByRoundService` gains `getBattle`.

**Tests and docs**

- [x] Service seam: an unknown Battle is reported.
- [x] HTTP seam: the Battle GET answers 200 and 404.
- [x] Routed-pages seam:
  - Chips select Rounds, and revisiting a Round sends no second request.
  - The modal renders the Battle.
  - A failed chip fetch shows a toast, and a failed Battle fetch shows the error inside the modal.
- [x] The README documents the Battle GET.

## Comments

**From ticket 10 (design note for the Battle modal's 404).** The Tournament page turns any 404 into the "no longer exists" page through `handledAsTournamentGone`, a private method of `RoundByRoundTournamentComponent`. If the Battle modal is its own component that fetches the Battle, it can't reach that method, so its 404 would only show as an error inside the modal, against "A 404 shows the 'no longer exists' page". Two ways out:

1. **Recommended: the modal emits an event.** The modal keeps its fetch, loading state and in-modal errors. On a 404 only, it emits `@Output() tournamentGone`, and the page binds `(tournamentGone)` to switch to the "no longer exists" page. This is the same pattern as `BattleHistoryModalComponent`'s `(closeModal)`.
2. **The page fetches and the modal only displays.** The page calls `getBattle` and passes the Battle or the error message to the modal as inputs, so the 404 goes through `handledAsTournamentGone` like every other request on the page. The cost is more state on the page: the open Battle, its loading flag and its error.

Either way, cover it at the routed-pages seam: open a Battle, flush a 404, and expect the "no longer exists" page.
