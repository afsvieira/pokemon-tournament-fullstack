# 05: Say what changed after Process Round and at Complete

**Spec:** [Round-by-round legibility](../spec.md). Phase 2.

**Branch:** `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament`. Every ticket is implemented on this branch, one commit per ticket, pushed to `origin` when the ticket is done; the branch is the source each ticket starts from and merges back into nothing until the whole spec is done. Do not commit this work on `feature/round-by-round-tournament` or `main`.

**What to build:** After Process Round the page tells the user what happened: a polite announcement "Round N processed", focus on the new Round's heading and a single pulse of the Round panel (skipped under reduced motion). When the Tournament becomes Complete, one line names who leads the Standings with their record, so the end of the Tournament has a closing line.

**Blocked by:** 02 (Standings as a table with Position).

**Status:** done

**UI**

- [x] A polite live region under the page header announces "Round N processed" after each successful Process Round; it is empty otherwise and is not announced on load or chip selection.
- [x] The Round panel's heading is programmatically focusable and receives focus when a new Round lands from Process Round, not when a chip is clicked.
- [x] The Round panel's border pulses once when a new Round lands; no pulse under `prefers-reduced-motion`.
- [x] When the Tournament is Complete the badge is accompanied by one line: "Complete · Alakazam leads the Standings 14–0–1". With several Pokémon on Position 1: "Complete · Alakazam and Primeape lead the Standings 14–0–1" (names joined with commas and "and", in default order). The record is wins–losses–ties.
- [x] The line uses "leads the Standings"; "champion", "winner of the Tournament" and "ranking" do not appear.
- [x] The line also appears when a Complete Tournament is reopened from the Tournament History.

**Tests and docs**

- [x] Routed-pages seam, Round-by-Round page spec: the live region text after Process Round and its absence after a chip click; focus on the Round heading after Process Round; the Complete line naming one leader and, with a shared lead, two leaders; the line on reopening a Complete Tournament.
- [x] README's Round by Round feature bullets mention the announcement and the Complete line.

## Comments

**Done** in commit 48be665 (feat(frontend): say what changed after Process Round and name the leader at Complete).

Notes: the "✔ Complete" badge is hidden from assistive technology, since the Complete line next to it starts with "Complete" and would otherwise be read twice. The Round panel's header became an h2 so it can be a focusable heading. The live region is cleared when Process Round starts, on load and on a chip, so it is empty after a failed Process Round too.
