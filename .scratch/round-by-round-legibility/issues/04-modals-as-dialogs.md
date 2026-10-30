# 04: Modals behave as dialogs

**Spec:** [Round-by-round legibility](../spec.md)

**Branch:** `feature/round-by-round-legibility`, branched from `feature/round-by-round-tournament`. Every ticket is implemented on this branch, one commit per ticket, pushed to `origin` when the ticket is done; the branch is the source each ticket starts from and merges back into nothing until the whole spec is done. Do not commit this work on `feature/round-by-round-tournament` or `main`.

**What to build:** Opening the Battle modal, the Battle History modal or the Tournament Rules modal behaves like a dialog: focus moves in, Escape closes it, Tab stays inside, the page behind doesn't scroll, assistive technology hears a dialog with its title, and closing it returns focus to the control that opened it. Backdrop click and the close button keep working as today.

**Blocked by:** None (can start immediately).

**Status:** done

**UI**

- [x] One shared dialog behaviour is applied to the root of all three modals, so they stay one component in behaviour.
- [x] The root carries `role="dialog"`, `aria-modal="true"` and `aria-labelledby` pointing at the modal title.
- [x] On open, the element that had focus is remembered and focus moves to the close button.
- [x] Escape closes the modal through the same path as the close button (the Battle modal keeps dropping an in-flight request when closed).
- [x] Tab from the last focusable element lands on the first, and Shift+Tab from the first lands on the last.
- [x] While a modal is open the document doesn't scroll; closing it restores scrolling.
- [x] On close, focus returns to the remembered element (the Battle row, the View Battles button, the Rules button). When that element is gone, focus falls back to the page's main heading rather than the body.
- [x] Backdrop click and the close button still close each modal; fetching, loading and error behaviour inside the modals are unchanged.

**Tests and docs**

- [x] Routed-pages seam, Round-by-Round page spec, Battle modal: on open the dialog role, `aria-modal` and title are present and the close button has focus; Escape closes; Tab from the last focusable element lands on the first; closing returns focus to the row that opened it.
- [x] Routed-pages seam, Instant Simulation page spec: the same four checks for the Battle History modal and the Tournament Rules modal.
- [x] README's Features mention keyboard and screen-reader support for the modals in one line.

## Comments

**Done** in commit 737f931 (feat(frontend): make the Battle, Battle History and Tournament Rules modals behave as dialogs).

Notes: Bootstrap 5's stylesheet has no `.modal-open` rule (its own JS sets the style inline, and the app doesn't use it), so the scroll lock is a `body.modal-open` rule in the global stylesheet. The Battle modal and the Battle History modal have one focusable element, the close button, so their Tab checks assert that the dialog cancels the key; the Tournament Rules modal, with two buttons, checks the actual cycle. The Instant Simulation page spec was a plain TestBed component spec, not a routed one; its new dialog tests follow the file's style and drive the rendered DOM with the real service and the fake API.
