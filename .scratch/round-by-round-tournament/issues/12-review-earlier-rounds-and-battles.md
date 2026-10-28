# 12: Review earlier Rounds and Battles

**Spec:** [Round-by-round Tournament](../spec.md)

**What to build:** On a Tournament's page, the user can go back to any played Round with a row of Round chips, and open any single Battle in a modal that shows both Pokémon and the result.

**Blocked by:** 11 (Process Rounds to the end).

**Status:** ready-for-agent

**API**

- [ ] `GET /pokemon/tournament/{id:guid}/battles/{battleId:int}` answers 200 with the Battle.
- [ ] A Battle outside 1–120, or not yet played, answers 404 `{ "error": "Battle not found." }`. An unknown Tournament answers 404 `{ "error": "Tournament not found." }`.
- [ ] The route uses `RoundByRoundPolicy` and reads under the Tournament's lock.

**UI**

- [ ] The page shows one chip per Round, 1–15:
  - Played Rounds are clickable, and the selected one is highlighted.
  - Rounds not yet played are disabled.
  - After Process Round, the newest Round is selected.
- [ ] Clicking an earlier Round fetches it once, keeps it in the component and shows it in the Round panel. The cards keep showing the current Standings.
- [ ] A failed chip fetch shows a toast, and the previously selected Round stays selected.
- [ ] Clicking a Battle row opens a modal that fetches the Battle and shows both Pokémon (image, type, base experience) and the winner, or "Tie".
- [ ] When the modal's fetch fails, the message appears inside the modal, which keeps its close button. A 404 shows the "no longer exists" page.
- [ ] `RoundByRoundService` gains `getBattle`.

**Tests and docs**

- [ ] Service seam: an unknown Battle is reported.
- [ ] HTTP seam: the Battle GET answers 200 and 404.
- [ ] Routed-pages seam:
  - Chips select Rounds, and revisiting a Round sends no second request.
  - The modal renders the Battle.
  - A failed chip fetch shows a toast, and a failed Battle fetch shows the error inside the modal.
- [ ] The README documents the Battle GET.
