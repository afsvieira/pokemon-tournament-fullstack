# 02: Standings as a table with Position

**Spec:** [Round-by-round legibility](../spec.md)

**Branch:** `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament`. Every ticket is implemented on this branch, one commit per ticket, pushed to `origin` when the ticket is done; the branch is the source each ticket starts from and merges back into nothing until the whole spec is done. Do not commit this work on `feature/round-by-round-tournament` or `main`.

**What to build:** On the Round-by-Round page the Standings are one row per Pokémon, like a league page: Position (shared when wins, losses and ties are equal), the sprite where a club crest would be, name and type, W, L, T and id. Column headers sort; the default order is most wins, then fewest losses, then name. Once the Tournament is Complete the leader's row is highlighted with a trophy. The Instant Simulation keeps its cards, sort controls and win rate untouched.

**Blocked by:** None (can start immediately).

**Status:** done

**UI**

- [x] The card grid and the sort controls on the Round-by-Round page are replaced by a table inside the same bordered card shell the Tournament History uses. The Pokémon card component and the sort controls component are unchanged and still used by the Instant Simulation.
- [x] Columns in order: Position; Pokémon (32px sprite, name, type icon hidden from assistive technology with a visually hidden type name); W; L; T; id in a muted monospace. W, L and T headers expose their full words (wins, losses, ties) to assistive technology. The id column is hidden below the small breakpoint; the table never scrolls horizontally.
- [x] Position comes from the default order (wins descending, losses ascending, name ascending case-insensitive) with standard competition ranking: equal records share a Position and the next one skips (1, 1, 3). Position is a property of the Pokémon: sorting by another column reorders rows but every Pokémon keeps its Position.
- [x] The default order above replaces the page's current "wins descending" default, so the table is deterministic from the first render.
- [x] Clicking the W, L, T, Name or ID header sorts by that field; the first click sorts wins, losses and ties descending and name and id ascending, a second click on the same header flips the direction. The sorted header carries `aria-sort`. Sorting stays local, with no new API request.
- [x] When the Tournament is Complete, every row on Position 1 is highlighted with the theme's success tint and a trophy next to the name.
- [x] Win rate is not shown on this page. *(Reversed after the design pass of 2026-10-29: the owner asked for a bold win rate column, one decimal, before W, as the assessment's measure of who leads.)*
- [x] The heading stays "Standings"; no label, title or tooltip says "table", "ranking", "leaderboard" or "league".
- [x] The table keeps showing the current Standings while an earlier Round is reviewed, and updates after every Process Round, as the cards did.

**Tests and docs**

- [x] Routed-pages seam, Round-by-Round page spec: sixteen rows; Positions 1, 1, 3 for equal records; default order wins, then losses, then name; clicking W, L, T, Name and ID sorts and a second click flips, with `aria-sort` following; Positions stay with their Pokémon after sorting; the Complete Tournament highlights every row on Position 1; no win rate on the page; the sort controls are absent; no extra request on sort.
- [x] Tests that asserted card wins, card order or the sort controls on this page are rewritten against the table; the shared test builders gain equal records, a single leader and a shared lead.
- [x] Instant Simulation page spec and the Pokémon card spec still pass unchanged.
- [x] Glossary gains **Position** (a Pokémon's place in the Standings by the default order; shared when wins, losses and ties are equal), through the domain-modeling process.
- [x] README's Round by Round feature bullets describe the Standings rows, Position, W/L/T and header sorting. Architecture notes' "values that change together" add the sort fields now also present as table headers, and note that the Pokémon card and sort controls belong to the Instant Simulation only.

## Comments

**Done** in commit 403543b (feat(frontend): show the Standings as rows with a Position on the round-by-round page).

Notes: Position counts the Pokémon with a better record (more wins, or equal wins and fewer losses); ties are not compared because every Pokémon fights once per Round, so equal wins and losses imply equal ties. The id is shown as "#003", as the Instant Simulation cards show it. Pokémon equal on the sorted column keep the default order, so a sort is deterministic. The test builders gained one generic `createTournamentWithRecords`; the equal-records, single-leader and shared-lead cases are literal records in the page spec.
