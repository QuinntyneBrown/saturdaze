The sticky application bar shown from 720px: the Saturdaze wordmark, the four primary destinations (Weekend · Ideas · Past · Family) and the account avatar. Below 720px the host is `display: none` and `sd-bottom-nav` takes over — the two are one navigation contract (ADR-006, ADR-009).

The host carries `.topbar` from `docs/mocks/styles/app.css`; links are `.topbar__link` with `data-nav` and `aria-current="page"` on the active one, so the e2e page objects locate it identically against the mocks and the app. `active` is a `NavKey` the app shell reads from route `data.nav`; `email` feeds the avatar initial; `accountClick` emits the avatar button so the shell can anchor the account menu.

The bar is transparent at the top of the page and fades in a blurred backdrop once the window scrolls (`Scrolled` host directive → `[data-scrolled]`).
