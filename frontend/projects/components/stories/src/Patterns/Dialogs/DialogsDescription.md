Every modal in Saturdaze is an `sd-dialog` panel opened through `@angular/cdk/dialog` (never a hand-rolled overlay, never `window.confirm`). The CDK owns the backdrop, focus trap, Escape and the `role="dialog"` container; the panel labels it with its own `<h2>`. Open with `panelClass: 'sd-dialog-panel'`: below 720px the panel is a bottom sheet with a grip, from 720px a centred modal.

The stories render panels inline with `static` (the design gallery does the same through the `SD_DIALOG_STATIC` provider), so no overlay is needed here.

- **Confirmations** (the app's one `ConfirmDialog`): title as a question, one supporting line, optional `sd-well` saying what is kept, then Cancel (quiet) and the confirm button in `[slot=actions]`. Destructive and session-ending actions use `variant="danger"`.
- **Forms** use `wide` (520px) and may put a destructive "Remove" in `[slot=actions-left]`.
- **Share** shows an `sd-copy-field` with the read-only link and a single Done.

On phones the actions stack with the primary on top. Composition mirrors `docs/mocks/pages/dialogs.html`.
