# 13: Tournament History

**Spec:** [Round-by-round Tournament](../spec.md)

**What to build:** The Round by Round page lists the Tournaments started since the API last started, newest first, with how far each one got. The user can open any of them.

**Blocked by:** 09 (Start a Tournament and see its 16 Pokémon).

**Status:** ready-for-agent

**API**

- [ ] `GET /pokemon/tournament/history` answers 200 with `[{ id, startedAt, roundsPlayed }]`:
  - newest first;
  - Tournaments that are not Complete included;
  - no paging.
- [ ] `history` is never captured as a Tournament id.
- [ ] The route uses `RoundByRoundPolicy`.

**UI**

- [ ] `/round-by-round` shows a "Tournament History" table under the Start Tournament button. Each row shows the start time (local), the Rounds played as "n/15" or "15/15 ✔" when Complete, and an Open button that navigates to `/round-by-round/:id`.
- [ ] With no Tournaments, the page shows "No Tournaments since the API last started."
- [ ] A History that fails to load shows an inline panel with the message and a Retry button, never an empty table.
- [ ] `RoundByRoundService` gains `getHistory`, with a Tournament History entry model in its own file.

**Tests and docs**

- [ ] Service seam, using `FakeTimeProvider`: the History is newest first and includes unfinished Tournaments.
- [ ] HTTP seam: the History route answers 200 with the list, not a 404 from the `{id}` route.
- [ ] Routed-pages seam:
  - The list renders, and Open navigates to the Tournament.
  - The empty state shows when there are no Tournaments.
  - A load failure shows the inline panel, and Retry reloads the list.
- [ ] The README documents the History endpoint.
