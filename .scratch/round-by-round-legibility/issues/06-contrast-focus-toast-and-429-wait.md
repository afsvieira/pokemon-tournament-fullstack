# 06: Contrast, focus rings, toast theme and the 429 wait

**Spec:** [Round-by-round legibility](../spec.md). Phase 2.

**Branch:** `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament`. Every ticket is implemented on this branch, one commit per ticket, pushed to `origin` when the ticket is done; the branch is the source each ticket starts from and merges back into nothing until the whole spec is done. Do not commit this work on `feature/round-by-round-tournament` or `main`.

**What to build:** Every text on the Round-by-Round page is readable in both themes, every focused control shows a visible ring, the error toast follows the theme, and after a 429 the toast stays until dismissed while Process Round waits out the rate-limit window. The Instant Simulation page gains the same fixes through the shared styles with no change in behaviour.

**Blocked by:** 01 (Battle rows mark the winner in place), 03 (Movement since the last Round).

**Status:** ready-for-agent

**UI**

- [ ] Every text on the page measures 4.5:1 or better against its effective background in both themes, including: the winner's name and the Tie pill in Battle rows; W, L, T and Movement values; the Round chips (active and inactive); Process Round, the active nav pill and the theme toggle at every point of their gradient; the sort header state; the Complete line. Texts move to Bootstrap's emphasis tokens or a stronger colour of the same hue; the primary gradient starts dark enough for white text; the outlined secondary buttons get a colour that passes on both body gradients.
- [ ] Every interactive control shows an explicit `:focus-visible` ring visible on both themes; the resting glow of the primary buttons is not the focus ring.
- [ ] The error toast uses theme-aware colours in both themes; the scrollbar track follows the theme.
- [ ] On 429, the toast stays until dismissed, and Process Round is disabled for the rate limit's window with the remaining seconds in its label ("Try again in 42 s"), then re-enables itself. The wait is client-side; the API is not asked for `Retry-After`.
- [ ] The Instant Simulation page gets the same contrast, focus and toast fixes through the shared styles; its behaviour and contract are unchanged.
- [ ] Disabled future Round chips keep their disabled look but are no longer the only difference from played, unselected chips: played chips are visibly distinct from future ones in both themes.

**Tests and docs**

- [ ] Routed-pages seam, Round-by-Round page spec: on 429 the toast remains after the auto-hide delay until dismissed, Process Round is disabled with a countdown label and re-enables after the window.
- [ ] Contrast and focus rings are verified by measurement in both themes at 1440 and 390 wide during the design pass, with the measured ratios recorded in this ticket's Comments; no unit test asserts colours.
- [ ] README's Features keep the rate-limit messages accurate ("wait a minute" plus the countdown on Process Round).
