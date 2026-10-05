The floating, pill-shaped primary navigation for phones (below 720px): the same four destinations as `sd-top-bar` — Weekend, Ideas, Past, Family — each an icon over a label. From 720px the host is `display: none` and the top bar takes over.

The host is the `<nav>` (`role="navigation"`, `aria-label="Primary"`) and carries `.bottom-nav` from `docs/mocks-v2/styles/app.css`; items are `.bottom-nav__item` with `data-nav` and `aria-current="page"` on the active one. `active` comes from route `data.nav` via the app shell.

The nav is `position: fixed`. Its `bottom` is `calc(12px + max(env(safe-area-inset-bottom, 0px), var(--sd-chrome-bottom, 0px)))` so it clears both the iOS home indicator and Safari's dynamic bottom toolbar, measured by the `VisualViewport` listener in `main.ts` (ADR-005). **Don't simplify that rule**; `bottom-nav-clearance.spec.ts` guards it.
