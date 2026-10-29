# 02: Standings as a table with Position

**Spec:** [Round-by-round legibility](../spec.md)

**Branch:** `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament`. Every ticket is implemented on this branch, one commit per ticket, pushed to `origin` when the ticket is done; the branch is the source each ticket starts from and merges back into nothing until the whole spec is done. Do not commit this work on `feature/round-by-round-tournament` or `main`.

**What to build:** On the Round-by-Round page the Standings are one row per Pokémon, like a league page: Position (shared when wins, losses and ties are equal), the sprite where a club crest would be, name and type, W, L, T and id. Column headers sort; the default order is most wins, then fewest losses, then name. Once the Tournament is Complete the leader's row is highlighted with a trophy. The Instant Simulation keeps its cards, sort controls and win rate untouched.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**UI**

- [ ] The card grid and the sort controls on the Round-by-Round page are replaced by a table inside the same bordered card shell the Tournament History uses. The Pokémon card component and the sort controls component are unchanged and still used by the Instant Simulation.
- [ ] Columns in order: Position; Pokémon (32px sprite, name, type icon hidden from assistive technology with a visually hidden type name); W; L; T; id in a muted monospace. W, L and T headers expose their full words (wins, losses, ties) to assistive technology. The id column is hidden below the small breakpoint; the table never scrolls horizontally.
- [ ] Position comes from the default order (wins descending, losses ascending, name ascending case-insensitive) with standard competition ranking: equal records share a Position and the next one skips (1, 1, 3). Position is a property of the Pokémon: sorting by another column reorders rows but every Pokémon keeps its Position.
- [ ] The default order above replaces the page's current "wins descending" default, so the table is deterministic from the first render.
- [ ] Clicking the W, L, T, Name or ID header sorts by that field; the first click sorts wins, losses and ties descending and name and id ascending, a second click on the same header flips the direction. The sorted header carries `aria-sort`. Sorting stays local, with no new API request.
- [ ] When the Tournament is Complete, every row on Position 1 is highlighted with the theme's success tint and a trophy next to the name.
- [ ] Win rate is not shown on this page.
- [ ] The heading stays "Standings"; no label, title or tooltip says "table", "ranking", "leaderboard" or "league".
- [ ] The table keeps showing the current Standings while an earlier Round is reviewed, and updates after every Process Round, as the cards did.

**Tests and docs**

- [ ] Routed-pages seam, Round-by-Round page spec: sixteen rows; Positions 1, 1, 3 for equal records; default order wins, then losses, then name; clicking W, L, T, Name and ID sorts and a second click flips, with `aria-sort` following; Positions stay with their Pokémon after sorting; the Complete Tournament highlights every row on Position 1; no win rate on the page; the sort controls are absent; no extra request on sort.
- [ ] Tests that asserted card wins, card order or the sort controls on this page are rewritten against the table; the shared test builders gain equal records, a single leader and a shared lead.
- [ ] Instant Simulation page spec and the Pokémon card spec still pass unchanged.
- [ ] Glossary gains **Position** (a Pokémon's place in the Standings by the default order; shared when wins, losses and ties are equal), through the domain-modeling process.
- [ ] README's Round by Round feature bullets describe the Standings rows, Position, W/L/T and header sorting. Architecture notes' "values that change together" add the sort fields now also present as table headers, and note that the Pokémon card and sort controls belong to the Instant Simulation only.
