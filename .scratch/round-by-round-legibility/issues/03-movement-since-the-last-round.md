# 03: Movement since the last Round

**Spec:** [Round-by-round legibility](../spec.md)

**Branch:** `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament`. Every ticket is implemented on this branch, one commit per ticket, pushed to `origin` when the ticket is done; the branch is the source each ticket starts from and merges back into nothing until the whole spec is done. Do not commit this work on `feature/round-by-round-tournament` or `main`.

**What to build:** After Process Round, each Standings row shows how many Positions its Pokémon moved: ▲n up, ▼n down, or a dash for no change. On load or when a Tournament is reopened from the Tournament History the page has seen no previous Round, so every row shows the dash. This column is an addition beyond the PDF and the docs say so.

**Blocked by:** 02 (Standings as a table with Position).

**Status:** done

**UI**

- [x] A Movement column sits between T and id, hidden below the small breakpoint.
- [x] When Process Round succeeds, the page keeps the Standings it is replacing, computes Positions for both sets with the default order (whatever the current sort), and shows the difference per Pokémon: ▲n when it moved up, ▼n when it moved down, a dash when it stayed. Up and down are also told apart by the symbol and by an accessible text ("up 2", "down 1", "no change"), not by colour alone.
- [x] On page load, on Retry and on reopening a Tournament there are no previous Standings and every row shows the dash.
- [x] Reviewing an earlier Round with the chips does not change the Movement: it reflects the last Round processed on this page.
- [x] Movement never appears in copy as "rank change" or "climb"; the glossary word is Movement.

**Tests and docs**

- [x] Routed-pages seam, Round-by-Round page spec: after Process Round a Pokémon that rose shows ▲n, one that fell shows ▼n and one that stayed shows the dash; all rows show the dash on load; the column survives a header sort unchanged.
- [x] Glossary gains **Movement** (the change of Position since the last Round processed on the page), through the domain-modeling process.
- [x] README's Round by Round feature bullets describe the Movement column, and the README names it as an addition beyond the PDF in the same place as the PokéAPI cache and the configurable rate limits.

## Comments

**Done** in commit 49c39d3 (feat(frontend): show each Pokémon's Movement since the last Round processed on the page).

Notes: the README had no earlier text naming the cache and the rate limits as additions, so it gains an "Additions beyond the assessment" subsection naming all three. The accessible text on load was "no change", as this ticket lists it; the pre-PR review applied story 18 instead, so before any Round is processed on the page the dash reads "no Round processed yet" and "no change" is kept for a Pokémon that stayed. A 409 on Process Round reloads the page, which resets the Movement to dashes: the page didn't witness that Round.
