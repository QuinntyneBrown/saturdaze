Pill-track tabs that are real links. `sd-segments` is a `role="navigation"` landmark carrying `.segments` (and `.segments--narrow`) from `docs/mocks/styles/app.css`; each tab in `tabs` renders an `a.segments__tab` with a `routerLink`.

The selected tab is `aria-current="page"`. By default the router decides (an exact match when `tab.exact` is set); pass `active` with a tab's label to choose explicitly — the Legal page does this because it switches on a URL fragment, which the router does not match on.

With `mode="tabs"` the track is an ARIA tablist instead of links: each tab is a button with `aria-selected` and `aria-controls` naming its `panel`, arrow keys move the selection, and `selected` binds two ways. The Weekend screen switches Saturday and Sunday this way (L2-104).
