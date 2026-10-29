# Spec: Round-by-round legibility

Status: done

## Problem Statement

A reviewer who opens a Tournament and presses Process Round sees eight rows and sixteen cards, and still can't answer the two questions the page exists for: who won each Battle, and who is leading.

- In a Battle row the two Pokémon look identical. The only sign of the result is a green "Alakazam wins" at the far right of the row, so the eye reads left, reads right, reads the result and matches the name back. A tie is the same column in grey. On a phone the row wraps onto three lines and the result ends up on its own.
- The Standings are sixteen Instant Simulation cards. They have no position, so two Pokémon at 5-0 give no clue who is first; they don't show how anyone moved after the last Round; they show a win rate the assessment never asked for; and they cost two screens of scrolling on a desktop and seven on a phone.
- Opening a Battle shows a modal that isn't a dialog: focus stays on the row behind it, Escape doesn't close it, Tab walks the page under the backdrop, and closing it drops focus on the page body. The Battle History and Tournament Rules modals of the Instant Simulation are built the same way.
- After Process Round nothing on the page says what changed: the panel refills silently and the Standings move below the fold. After Round 15 the reward is a small Complete badge.
- Several texts fail contrast in one or both themes (the result in a row, the stat values on the cards, the primary buttons on the start of their gradient, the outlined chips), the error toast keeps its dark colours in the light theme, and a 429 toast disappears while the button invites the same request again.

## Solution

Make the Round-by-Round page read like a league page, in two phases.

**Phase 1, this cycle:**

- **Battle rows mark the winner in place.** The winner's name is bold, in the theme's success colour, with a trophy before it; the loser's name is plain and muted. A tie keeps both names equal and replaces the "vs" with an explicit "Tie" pill. The trailing "X wins" column goes. On a phone the Battle number takes its own line and the two fighters sit either side of the marker.
- **Standings become a table.** One row per Pokémon with its position (shared when wins, losses and ties are equal), its sprite where a club crest would be, name and type, then W, L, T, its movement since the last Round and its id. Column headers sort; the default order is wins, then fewest losses, then name. When the Tournament is Complete the leader's row is highlighted. The heading stays "Standings"; the word "table" never appears in copy.
- **The three modals become dialogs.** Focus moves in on open and back to the opener on close, Escape closes, Tab stays inside, and assistive technology hears a dialog with a title.

**Phase 2, the next cycle:**

- **The page says what changed.** A polite live region announces the processed Round, the Round panel pulses once, and focus lands on it. When the Tournament becomes Complete, one line names who leads the Standings.
- **Contrast and theme fixes.** Every text on the page meets WCAG AA in both themes, focused controls show a visible ring, the toast follows the theme, and after a 429 the toast stays until dismissed while Process Round waits out the window.

The movement column is an addition beyond the PDF, like the PokéAPI cache and the configurable rate limits, and is named as such in the same places.

## User Stories

### Reading a Battle row

1. As a user, I want the winner's name in a Battle row to stand out from the loser's, so that I can see who won without reading a separate result.
2. As a user, I want a trophy next to the winner's name, so that the result is marked by more than colour.
3. As a user, I want a tie to show both names with equal weight and an explicit "Tie" between them, so that a tie never looks like a faint win.
4. As a user, I want the result read in place rather than in a column at the far right, so that my eye doesn't travel across the row and back.
5. As a user, I want each row to still show the Battle number, both Pokémon's type icons and base experience, so that nothing I could see before disappears.
6. As a user on a phone, I want the Battle number on its own line and the two fighters side by side under it, so that a row reads top to bottom instead of wrapping unpredictably.
7. As a user on a phone, I want long names like "Farfetch'd" or "Mr. Mime" to truncate instead of breaking the row, so that every row has the same shape.
8. As a screen reader user, I want a Battle row announced as "Battle 33, Alakazam vs Slowbro, Alakazam wins" (or "Tie"), so that I hear the whole result in one go.
9. As a screen reader user, I want a Pokémon's type read as a word, so that an icon-only type isn't silent.
10. As a user, I want the Battle modal to mark the winner the same way the row does, so that the two views agree.

### Reading the Standings

11. As a user, I want the Standings as one row per Pokémon, so that I see all sixteen on one screen.
12. As a user, I want a position number in front of each Pokémon, so that I know who is first, second and last.
13. As a user, I want Pokémon with the same wins, losses and ties to share a position (1, 1, 3), so that the table doesn't invent an order the results don't support.
14. As a user, I want the Pokémon's sprite where a club crest would be, followed by its name and type, so that I recognise it at a glance.
15. As a user, I want W, L and T columns, so that the record reads like a league table I already know.
16. As a user, I want to see how many positions each Pokémon moved since the last Round, so that I can follow the drama of a Round.
17. As a user, I want a Pokémon that didn't move to show a dash, so that no movement is clearly "stayed", not "unknown".
18. As a user, I want the movement column blank-dashed when I reopen a Tournament from the Tournament History, so that the page never claims a movement it didn't witness.
19. As a user, I want the Pokémon's id in a muted column, so that I can still sort and refer by id.
20. As a user, I want the default order to be most wins, then fewest losses, then name, so that two Pokémon on the same wins are ordered the same way every time.
21. As a user, I want to sort by wins, losses, ties, name or id by clicking a column header, so that I don't need separate sort controls.
22. As a user, I want a second click on the same header to reverse the direction, so that I can read the table either way.
23. As a user, I want the sorted column marked, so that I can tell how the table is ordered.
24. As a user, I want the position number to stay with its Pokémon when I sort by another column, so that position means rank, not row number.
25. As a user, I want the leader's row highlighted with a trophy once the Tournament is Complete, so that the end of the Tournament has a visible result.
26. As a user, I want the Standings to keep updating after every Round and to keep the current Standings while I review an earlier Round, so that the table is never ambiguous.
27. As a user, I want the "Standings" heading to stay and no copy to call it a table or a leaderboard, so that the vocabulary stays the glossary's.
28. As a user on a phone, I want the table to fit the screen without horizontal scrolling, with the movement and id columns hidden, so that position, name and record are always visible.
29. As a screen reader user, I want the W, L and T headers to expand to wins, losses and ties, so that the abbreviations aren't a riddle.
30. As a screen reader user, I want the sorted header to expose its sort state, so that I know how the table is ordered.
31. As an existing user of the Instant Simulation, I want its cards, its sort controls and its win rate to stay exactly as they are, so that nothing I rely on changes.

### Using the modals

32. As a keyboard user, I want focus to move into the Battle modal when it opens, so that Tab and Escape act on the modal, not the page.
33. As a keyboard user, I want Escape to close the modal, so that I can leave it without reaching for the mouse.
34. As a keyboard user, I want Tab and Shift+Tab to cycle inside the modal, so that I can't land on controls hidden behind the backdrop.
35. As a keyboard user, I want focus to return to the Battle row I came from when the modal closes, so that I continue where I was.
36. As a screen reader user, I want the modal announced as a dialog with its title, so that I know a dialog opened and what it is about.
37. As a user, I want the page not to scroll behind the open modal, so that the backdrop doesn't slide around.
38. As a user, I want clicking the backdrop or the close button to keep closing the modal, so that nothing I did before stops working.
39. As a user of the Instant Simulation, I want the Battle History and Tournament Rules modals to behave as the same kind of dialog, so that all three modals feel like one component.

### Following a Round (phase 2)

40. As a user, I want to be told that a Round was processed, so that I know the click did something even when the change is below the fold.
41. As a user, I want the Round panel to draw my eye once when a new Round lands, so that I notice where the change happened.
42. As a user who prefers reduced motion, I want the pulse skipped, so that the page respects my setting.
43. As a keyboard or screen reader user, I want focus to land on the new Round's heading after Process Round, so that I hear the result and can read on from there.
44. As a user, I want the Complete state to name who leads the Standings with their record, so that the end of the Tournament has a closing line.
45. As a user, I want two or more Pokémon sharing first place to all be named as leading, so that the line never picks a winner the results don't.

### Contrast, theme and rate limits (phase 2)

46. As a user with low vision, I want every text on the page to meet WCAG AA in the dark theme, so that results, stats and buttons are readable.
47. As a user with low vision, I want the same in the light theme, so that switching theme never makes a value disappear.
48. As a keyboard user, I want every focused chip and button to show a visible ring in both themes, so that I always know where I am.
49. As a user of the light theme, I want the error toast to follow the theme, so that it doesn't look like a leftover from the dark theme.
50. As a user who hit the rate limit, I want the toast to stay until I dismiss it and Process Round to wait out the window, so that I don't keep hitting the same wall.
51. As a user of the Instant Simulation, I want its page to gain the same contrast fixes through the shared styles without any change in behaviour, so that both flows stay consistent.

### Documentation

52. As a reviewer reading the repo, I want the README to describe the Standings, the winner marking and the movement column, so that the docs match the screen.
53. As a reviewer reading the repo, I want the movement column named as an addition beyond the PDF next to the cache and the configurable rate limits, so that the extras are honest and easy to find.
54. As a reviewer reading the repo, I want "Position" in the glossary, so that the new term has one definition.

## Implementation Decisions

### Battle rows

- The Round panel's row keeps one native button per Battle and becomes four cells: the Battle number, the first fighter, a centre marker, the second fighter. The trailing result column is removed at every width.
- **Winner marking** is on the fighter itself: bold name, the theme's success emphasis colour, and a trophy icon before the name. The loser is plain weight in the theme's secondary body colour. The icon is hidden from assistive technology.
- **Tie**: both fighters keep the loser's plain treatment and the centre marker shows a small secondary pill reading "Tie" instead of "vs".
- The existing result helper keeps wording the result ("Alakazam wins", "Tie"); it feeds the row's accessible name, "Battle 33, Alakazam vs Slowbro, Alakazam wins", and the Battle modal's result line. The helper that chose a colour class for the trailing column is retired with the column.
- Type icons in rows and in the Battle modal get a visually hidden type name next to them and are hidden from assistive technology themselves.
- **Narrow screens** (below the small breakpoint): the Battle number sits on its own line; under it the fighters and the marker form a three-column grid with truncating names. The in-place marking survives, so no result column is needed there either.
- The Battle modal's winner card keeps its success border and gains the same bold name and trophy, so the modal and the row agree.

### Standings table

- The Round-by-Round page replaces the card grid and the sort controls with a table inside the same bordered card shell the Tournament History uses. The Pokémon card component and the sort controls component are untouched and stay on the Instant Simulation page.
- **Columns**, in order: position; Pokémon (32px sprite, name, type icon with a visually hidden type name); W; L; T; movement; id in a muted monospace. W, L and T headers carry their full words for assistive technology. The movement and id columns are hidden below the small breakpoint; the table never scrolls horizontally.
- **Position** is a property of the Pokémon, not the row index: it is computed from the default order (wins descending, then losses ascending, then name ascending, case-insensitive) with standard competition ranking, so Pokémon with equal wins, losses and ties share a position and the next position skips (1, 1, 3). Sorting by another column reorders the rows but every Pokémon keeps its position.
- **Default order** is that same order, so the table is deterministic from the first render. The page's current "wins descending" default is replaced by it.
- **Sorting** by header click over the five spec fields (wins, losses, ties, name, id). The first click sorts wins, losses and ties descending and name and id ascending; a second click on the same header flips the direction. The sorted header exposes `aria-sort`; the page keeps its current sort state shape, so the local re-sorting stays local.
- **Movement** is the difference between a Pokémon's position before and after the last Round processed on this page: the page keeps the previous Standings when it replaces them after Process Round, computes positions for both, and shows ▲n, ▼n or a dash. On load or reopen there are no previous Standings and every row shows the dash. Positions use the default order, whatever the current sort.
- **Complete**: when the Tournament is Complete, every row sharing position 1 is highlighted with the theme's success tint and a trophy next to the name.
- Win rate is not shown on this page. It stays in the API payload and on the Instant Simulation cards.
- Copy: the heading stays "Standings". No label, title or tooltip says "table", "ranking", "leaderboard" or "league".

### Modals as dialogs

- One shared dialog behaviour, applied to the root of the Battle modal, the Battle History modal and the Tournament Rules modal, so the three stay one component in behaviour:
  - the root carries `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at the modal title;
  - on open, focus moves to the close button and the element that had focus is remembered;
  - Escape asks the modal to close through the same path as the close button;
  - Tab and Shift+Tab cycle among the modal's focusable elements;
  - while open, the document doesn't scroll;
  - on close, focus returns to the remembered element.
- Backdrop click and the close button keep closing the modal as today. The modals' own fetching, loading and error behaviour don't change.

### Feedback after Process Round and at Complete (phase 2)

- A polite live region under the page header announces "Round N processed" after a successful Process Round. The Round panel's heading becomes focusable programmatically and receives focus at the same moment.
- The Round panel pulses its border once when a new Round lands; the pulse is skipped under `prefers-reduced-motion`.
- When the Tournament is Complete the badge is accompanied by one line, "Complete · Alakazam leads the Standings 14–0–1"; with several Pokémon on position 1, "Alakazam and Primeape lead the Standings 14–0–1". The wording uses "leads the Standings"; "champion" and "winner of the Tournament" are not used.

### Contrast, theme and rate limits (phase 2)

- Texts that fail AA move to Bootstrap's emphasis tokens (success, danger, secondary) or to a stronger colour of the same hue; the primary gradient starts dark enough for white text to pass at every point; the outlined secondary buttons (Round chips, sort direction, theme toggle) get a colour that passes on both body gradients.
- Every control gets an explicit `:focus-visible` ring that is visible on both themes; the resting glow is not a focus ring.
- The error toast uses theme-aware colours; the scrollbar track follows the theme.
- On 429 the toast stays until dismissed and Process Round stays disabled for the rate limit's window, showing the remaining seconds; the disable is a client-side wait, the API is not asked for `Retry-After`.
- These are shared styles, so the Instant Simulation page gains the same fixes with no change in behaviour.

### Documentation

- README: the Round by Round feature bullets describe the Standings (position, W/L/T, movement, header sorting), the winner marking and the dialogs; the movement column is named as an addition beyond the PDF, in the same place as the cache and the configurable rate limits.
- Architecture notes: "values that change together" gains the sort fields now also present as table headers, and notes that the Pokémon card and sort controls belong to the Instant Simulation only.
- Glossary: add **Position** (a Pokémon's place in the Standings by the default order; shared when wins, losses and ties are equal) and **Movement** (the change of Position since the last Round processed on the page), through the domain-modeling process.

## Testing Decisions

A good test drives the page as a user would and asserts what a user can observe: rendered text, order of rows, attributes assistive technology reads (`aria-label`, `aria-sort`, `role`, `aria-modal`), the focused element, and requests sent to the faked API. It never asserts a private field, a CSS class chosen for looks, or how a position was computed. The API is the only fake.

### One seam: the routed pages

Prior art: the Round-by-Round page spec and the Instant Simulation page spec, both using `RouterTestingHarness` with the app routes, `HttpTestingController`, the real services and the shared test Tournament builders; `httpMock.verify()` in `afterEach`.

The Round-by-Round page spec covers:

- **Battle rows**: the winner's name is marked and the loser's is not; a tie shows "Tie" between two unmarked names and no trophy; the row's accessible name reads "Battle N, A vs B, A wins" / "Tie"; the trailing result text no longer exists.
- **Standings table**: sixteen rows; positions 1, 1, 3 for equal records; default order wins, then losses, then name; clicking W, L, T, Name and ID headers sorts, a second click flips, `aria-sort` follows; positions stay with their Pokémon after sorting; movement shows ▲/▼/dash after Process Round and dashes on load; the Complete Tournament highlights every row on position 1; no win rate on the page; the Instant Simulation's sort controls are absent.
- **Battle modal as a dialog**: on open the dialog role, `aria-modal` and title are present and the close button has focus; Escape closes; Tab from the last focusable element lands on the first; closing returns focus to the row that opened it.
- **Phase 2**: the live region text after Process Round; focus on the Round heading; the Complete line naming one leader and two shared leaders; the 429 toast staying until dismissed and Process Round disabled meanwhile.

The Instant Simulation page spec covers the Battle History and Tournament Rules modals as dialogs with the same four checks, and keeps asserting that its cards, sort controls and win rate are unchanged.

Existing tests that assert card wins, card order or the sort controls on the Round-by-Round page are rewritten against the table; the shared test builders gain the records those tests need (equal records, a leader, a shared lead). The Pokémon card component spec is unchanged.

Contrast is verified by measurement during the design pass, not by unit tests.

## Out of Scope

- The reason a Battle was won (type advantage, base experience, equal) in rows or modal, and any `decidedBy` field in the API.
- Keyboard stepping between Rounds, a Round strip or stepper replacing the fifteen chips, or restyling played versus future chips.
- Opening a Pokémon's Battles from the Standings on the Round-by-Round page.
- Any change to the API: payloads, sorting on the server, `Retry-After`, points or any scoring beyond wins, losses and ties.
- Points, goal-difference or games-played columns; a Base XP column.
- Changing how a Tournament is identified (the timestamp heading) on this page or in the Tournament History.
- Changes to the Instant Simulation page beyond the shared contrast fixes and the shared dialog behaviour of its two modals.
- Replacing Bootstrap or Font Awesome, or adding imagery beyond PokéAPI sprites.

## Further Notes

- Source of truth for behaviour: `docs/assessment-v2.pdf`. Vocabulary: `GLOSSARY.md`. Product constraints: Bootstrap 5 + Font Awesome stay; PokéAPI sprites only; glossary terms in all copy; the spec is the ceiling and additions are named.
- The issues came out of a design review of the Round-by-Round page on 2026-10-29 (score 25/40, ten heuristics; one blocking issue, the modal; two major, the rows and the Standings). The review's measurements are the acceptance bar for the contrast ticket: every text at 4.5:1 or better on both themes, including the start of the primary gradient and the outlined chips.
- Tickets, in dependency order (blockers first):
  - [01 Battle rows mark the winner in place](issues/01-battle-rows-mark-the-winner.md)
  - [02 Standings as a table with Position](issues/02-standings-table-with-position.md)
  - [03 Movement since the last Round](issues/03-movement-since-the-last-round.md), blocked by 02
  - [04 Modals behave as dialogs](issues/04-modals-as-dialogs.md)
  - [05 Say what changed after Process Round and at Complete](issues/05-say-what-changed-after-process-round.md), phase 2, blocked by 02
  - [06 Contrast, focus rings, toast theme and the 429 wait](issues/06-contrast-focus-toast-and-429-wait.md), phase 2, blocked by 01 and 03
  Each ticket carries its own README and glossary changes; there is no separate docs ticket.
- Git: built on `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament` and pushed to `origin`. Every ticket starts from and lands on that branch, one commit per ticket, commit bodies closing tickets by number and path. The branch is proposed as a PR only when every ticket is done.
