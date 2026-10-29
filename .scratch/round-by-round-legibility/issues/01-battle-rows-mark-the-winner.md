# 01: Battle rows mark the winner in place

**Spec:** [Round-by-round legibility](../spec.md)

**Branch:** `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament`. Every ticket is implemented on this branch, one commit per ticket, pushed to `origin` when the ticket is done; the branch is the source each ticket starts from and merges back into nothing until the whole spec is done. Do not commit this work on `feature/round-by-round-tournament` or `main`.

**What to build:** In a Round's list of Battles, the user sees who won without reading a separate result: the winner's name is bold, in the success colour, with a trophy before it, and the loser's name is plain and muted. A tie keeps both names equal and shows an explicit "Tie" pill where the "vs" was. The trailing "X wins" column is gone at every width, and on a phone the Battle number takes its own line with the two fighters side by side under it. The Battle modal marks the winner the same way.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**UI**

- [ ] A Battle row is one native button with four cells: Battle number, first fighter, centre marker, second fighter. The trailing result column no longer exists.
- [ ] The winner's fighter shows a trophy icon (hidden from assistive technology), a bold name and the theme's success emphasis colour; the loser's fighter shows a plain-weight name in the theme's secondary body colour.
- [ ] On a tie, both fighters get the loser's plain treatment and the centre marker is a small secondary pill reading "Tie" instead of "vs".
- [ ] Each row's accessible name reads "Battle 33, Alakazam vs Slowbro, Alakazam wins", or ends in "Tie", built from the existing result-wording helper. The helper that picked a colour class for the old column is removed.
- [ ] Type icons in rows and in the Battle modal are hidden from assistive technology and followed by a visually hidden type name.
- [ ] Below the small breakpoint the Battle number sits on its own line and the fighters and marker form a three-column grid with truncating names ("Farfetch'd", "Mr. Mime" fit without breaking the row).
- [ ] The Battle modal's winner card keeps its success border and gains the same bold name and trophy; its result line keeps the same wording.
- [ ] Copy uses only glossary terms: Battle, Round, Tie.

**Tests and docs**

- [ ] Routed-pages seam, Round-by-Round page spec: the winner's name is marked and the loser's is not; a tie shows "Tie" between two unmarked names and no trophy; the row's accessible name reads as above; the old trailing result text is absent; the modal marks the winner the same way.
- [ ] Shared test Round builder keeps producing one tie per Round so both cases are covered.
- [ ] README's Round by Round feature bullets describe the in-place winner marking and the Tie pill.
