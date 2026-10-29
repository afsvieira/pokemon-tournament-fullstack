# 06: Contrast, focus rings, toast theme and the 429 wait

**Spec:** [Round-by-round legibility](../spec.md). Phase 2.

**Branch:** `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament`. Every ticket is implemented on this branch, one commit per ticket, pushed to `origin` when the ticket is done; the branch is the source each ticket starts from and merges back into nothing until the whole spec is done. Do not commit this work on `feature/round-by-round-tournament` or `main`.

**What to build:** Every text on the Round-by-Round page is readable in both themes, every focused control shows a visible ring, the error toast follows the theme, and after a 429 the toast stays until dismissed while Process Round waits out the rate-limit window. The Instant Simulation page gains the same fixes through the shared styles with no change in behaviour.

**Blocked by:** 01 (Battle rows mark the winner in place), 03 (Movement since the last Round).

**Status:** done

**UI**

- [x] Every text on the page measures 4.5:1 or better against its effective background in both themes, including: the winner's name and the Tie pill in Battle rows; W, L, T and Movement values; the Round chips (active and inactive); Process Round, the active nav pill and the theme toggle at every point of their gradient; the sort header state; the Complete line. Texts move to Bootstrap's emphasis tokens or a stronger colour of the same hue; the primary gradient starts dark enough for white text; the outlined secondary buttons get a colour that passes on both body gradients.
- [x] Every interactive control shows an explicit `:focus-visible` ring visible on both themes; the resting glow of the primary buttons is not the focus ring.
- [x] The error toast uses theme-aware colours in both themes; the scrollbar track follows the theme.
- [x] On 429, the toast stays until dismissed, and Process Round is disabled for the rate limit's window with the remaining seconds in its label ("Try again in 42 s"), then re-enables itself. The wait is client-side; the API is not asked for `Retry-After`.
- [x] The Instant Simulation page gets the same contrast, focus and toast fixes through the shared styles; its behaviour and contract are unchanged.
- [x] Disabled future Round chips keep their disabled look but are no longer the only difference from played, unselected chips: played chips are visibly distinct from future ones in both themes.

**Tests and docs**

- [x] Routed-pages seam, Round-by-Round page spec: on 429 the toast remains after the auto-hide delay until dismissed, Process Round is disabled with a countdown label and re-enables after the window.
- [x] Contrast and focus rings are verified by measurement in both themes at 1440 and 390 wide during the design pass, with the measured ratios recorded in this ticket's Comments; no unit test asserts colours.
- [x] README's Features keep the rate-limit messages accurate ("wait a minute" plus the countdown on Process Round).

## Comments

**Measurements** (2026-10-29, Chromium, computed colours against the effective background, with the opacity of the element and its ancestors applied to the text; a body gradient counts both stops and the worse ratio is kept; the Tie pill, the Complete line and badge, the disabled Process Round label and the toast were probed with the same classes on a page after three Rounds):

| Text | Dark 1440 | Dark 390 | Light 1440 | Light 390 |
|---|---|---|---|---|
| winner name | 6.26 | 6.26 | 11.33 | 11.33 |
| loser name | 7.00 | 7.00 | 6.14 | 6.14 |
| Battle number | 7.00 | 7.00 | 6.14 | 6.14 |
| XP | 7.00 | 7.00 | 6.14 | 6.14 |
| Tie pill | 4.69 | 4.69 | 4.69 | 4.69 |
| W value | 14.63 | 14.63 | 17.71 | 17.71 |
| L value | 14.63 | 14.63 | 17.71 | 17.71 |
| T value | 14.63 | 14.63 | 17.71 | 17.71 |
| Movement up | 6.26 | 6.26 | 11.33 | 11.33 |
| Movement down | 5.79 | 5.79 | 11.51 | 11.51 |
| Movement dash | 7.00 | 7.00 | 6.14 | 6.14 |
| Position | 7.00 | 7.00 | 6.14 | 6.14 |
| id | 7.00 | 7.00 | 6.14 | 6.14 |
| sorted header | 14.63 | 14.63 | 17.71 | 17.71 |
| other header | 14.63 | 14.63 | 17.71 | 17.71 |
| Round chip active | 5.17 | 5.17 | 5.17 | 5.17 |
| Round chip played | 7.05 | 7.05 | 6.90 | 6.90 |
| Round chip future (disabled) | 3.86 | 3.86 | 3.07 | 3.07 |
| Process Round | 5.17 | 5.17 | 5.17 | 5.17 |
| nav pill active | 5.17 | 5.17 | 5.17 | 5.17 |
| nav pill inactive | 7.00 | 7.00 | 6.14 | 6.14 |
| theme toggle | 7.05 | 7.05 | 8.18 | 6.90 |
| Complete line | 6.26 | 6.26 | 11.33 | 11.33 |
| toast header | 4.53 | 4.53 | 4.53 | 4.53 |
| toast body | 11.85 | 11.85 | 15.43 | 15.43 |
| back link | 7.00 | 7.00 | 6.14 | 6.14 |
| Standings heading | 13.35 | 13.35 | 13.01 | 13.01 |
| Process Round disabled label | 5.26 | 5.26 | 5.67 | 5.67 |
| Rounds: label | 7.00 | 7.00 | 6.14 | 6.14 |
| Round progress badge | 4.69 | 4.69 | 4.69 | 4.69 |
| Complete badge | 4.53 | 4.53 | 4.53 | 4.53 |
| Round heading | 11.23 | 11.23 | 13.01 | 13.01 |

Every text is at 4.5:1 or better in both themes at 1440 and 390 wide, except the future Round chips, which are disabled controls (exempt from the contrast requirement, Bootstrap's disabled opacity) and are told apart from played chips by their dashed border. The viewport scrollbar track reads rgba(15, 23, 42, 0.5) on the dark theme and rgba(0, 0, 0, 0.06) on the light one.

**Focus rings**, read on each control reached with Tab (theme toggle, nav pills, back link, Process Round, Round chips, Battle rows, Standings sort headers, the toast's close button) and on the Battle modal's close button, ring colour against the body gradient (the modal's against the modal background):
- dark: btn btn-outline-secondary 3px solid 8.11:1, nav-link 3px solid 8.11:1, nav-link active 3px solid 8.11:1, back-link d-inline-flex 3px solid 8.11:1, btn btn-primary 3px solid 8.11:1, btn btn-sm 3px solid 8.11:1, list-group-item list-group-item-action 3px solid 8.11:1, btn btn-link 3px solid 8.11:1, btn-close btn-close-white 3px solid 8.11:1, modal btn-close 3px solid 8.55:1
- light: btn btn-outline-secondary 3px solid 5.65:1, nav-link 3px solid 5.65:1, nav-link active 3px solid 5.65:1, back-link d-inline-flex 3px solid 5.65:1, btn btn-primary 3px solid 5.65:1, btn btn-sm 3px solid 5.65:1, list-group-item list-group-item-action 3px solid 5.65:1, btn btn-link 3px solid 5.65:1, btn-close btn-close-white 3px solid 5.65:1, modal btn-close 3px solid 6.70:1

**Done** in commit 205c734 (feat(frontend): contrast, focus rings, theme-aware toast and the 429 wait).

Notes: a 429 from a Round chip gets the same persistent toast and wait as one from Process Round, since both hit the same policy. The countdown survives a change of Tournament on the same page, since the limit is per client. The scrollbar tokens sit on the root through `:root:has(body[data-bs-theme])`, because the viewport's scrollbar belongs to the root element and can't read the body's variables.
