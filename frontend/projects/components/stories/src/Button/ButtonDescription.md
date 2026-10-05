The one button. `sd-button` triggers an action; given an `href` it renders an anchor that routes in-app paths through the Angular router.

The host is `display: contents` — the inner `<button>` / `<a>` carries the `.btn` classes from `docs/mocks/styles/app.css` (`.btn--primary`, `.btn--sm`, `.btn--icon`, …), so pixel parity and the e2e locators hold. Project `[slot=leading]` / `[slot=trailing]` content (usually an `sd-icon`) around the label.
