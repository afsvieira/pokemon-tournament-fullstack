# Error experience in the new views

Type: grilling
Status: resolved
Blocked by: 02, 05
Map: [Round-by-round Tournament](../map.md)

## Question

How do the round-by-round views present each failure the new endpoints can return?

[New endpoints contract](01-new-endpoints-contract.md) fixes the statuses and their generic `{ error }` messages: 404 for an unknown Tournament, Round or Battle (and an empty 404 for a malformed id), 409 for Process Round on a Complete Tournament, 502 when PokéAPI fails on Start, 500 for anything unexpected. [Rate limit for the new endpoints](02-rate-limit-for-new-endpoints.md) decides when 429 is hit. Decide, per view from [Round-by-round frontend flow](05-frontend-flow.md):

- What the user sees for each status, and whether the API's `error` message is shown as is.
- What the user can do next: retry, go back to the Tournament History, start a new Tournament.
- The 409 the UI can still get, although the Process Round button is replaced once the Tournament is Complete ([Round-by-round frontend flow](05-frontend-flow.md)): a second tab still on Round 14 calls Process Round after the first tab has played Round 15.
- What happens to a bookmarked Tournament URL after an API restart (the Tournament is gone: 404).

The Instant Simulation page keeps its own error handling (`TournamentComponent.getErrorMessage`) unchanged.

## Answer

### Message shown

A helper shared by the round-by-round views picks the message:

- When the response body carries `error` (404, 409, 502), show it as is. [New endpoints contract](01-new-endpoints-contract.md) makes these fixed, generic strings meant for users.
- Otherwise, fall back on the status, with the Instant Simulation's wording:

| Status | Message |
|---|---|
| 0 | `Unable to connect to the server. Please check if the API is running.` |
| 429 | `Too many requests. Please wait a minute and try again.` |
| 500 and above | `Server error occurred. Please try again later.` |
| anything else | `An unexpected error occurred. Please try again.` |

The Instant Simulation page keeps its own `TournamentComponent.getErrorMessage` and toast, unchanged.

### Where it appears

| Failure | Shown as |
|---|---|
| Loading a page (the Tournament History list, a Tournament) | An inline panel in place of the content, with the message and a [Retry] button. A toast alone would leave an empty table that reads as "no Tournaments". |
| An action (Start, including its 502; Process Round; a Round chip) | A toast like the Instant Simulation's: red, top right, hidden after 5 seconds, extracted into an `ErrorToastComponent` for the new pages. The page state does not change (the selected Round stays as it was) and the control is enabled again. |
| The Battle modal | The message inside the modal, which keeps its close button. |

### Tournament gone (404)

On the Tournament page, any 404 (loading, Process Round, a Round chip or the Battle modal) replaces the whole page with:

```
 This Tournament no longer exists.
 Tournaments are kept in memory only until the API restarts.
 [Tournament History]   [Start Tournament]
```

That covers a saved URL after an API restart, an API restart in the middle of play, and a malformed id in the URL. Through the UI, a Round or Battle can only answer 404 when its Tournament is gone, because there are chips only for played Rounds.

### 409 in a stale tab

A tab that calls Process Round on a Tournament another tab has completed reloads the Tournament (`GET {id}` plus its last Round), so it shows Round 15 and the "✔ Complete" badge. It also shows the API's message in a toast: `Tournament is already complete.`
