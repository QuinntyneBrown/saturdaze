# ADR-009 — The v2 responsive shell and the mock-to-component class contract

**Status:** Accepted
**Date:** 2026-09-02
**Related:** [ADR-005](ADR-005-bottom-nav-device-chrome-clearance.md), [ADR-010](ADR-010-visual-parity-policy.md), [docs/mocks-v2/README.md](../mocks-v2/README.md).

## Context

The first design (`docs/mocks`, now deleted) was a phone app drawn inside a 440px canvas with a side rail, and the Angular app copied it: 21 routed pages, each rendering its own top bar and bottom nav, 29 components styled after the v1 mocks, and a Playwright suite whose baselines were captured from those mocks. It did not read as a web app on a laptop, the feature set had grown past what the family actually used, and the visual suite had been red since auth guards landed because no strategy existed for dates and weather in screenshots.

`docs/mocks-v2` is the redesign: five core screens (Weekend, Ideas, Past, Family, Review submissions), a responsive web-first layout, plain BEM HTML and one stylesheet. This ADR records how the Angular app implements it.

## Decisions

### 1. One shell, chosen by route data

`App` renders one `<main id="main" class="sd-frame">` with the outlet always mounted, and picks the chrome from the route's `data.shell`:

| shell | chrome | routes |
| --- | --- | --- |
| `app` (default) | `sd-top-bar` from 720px, `sd-bottom-nav` below it | weekend, ideas, past, family, review-submissions |
| `site` | `sd-sitebar` (brand, Sign in, optional CTA) | landing, legal, shared weekend, dialogs gallery |
| `bare` | none | sign-in, create-account, reset-password, verify-email |

Route data is merged along `pathFromRoot`, so the Ideas children inherit `nav: 'ideas'`. The shell writes `body[data-shell]` and `body[data-page]`, which the mocks also carry, so the e2e harness can wait for a page the same way against both.

The bottom nav keeps the ADR-005 clearance rule verbatim in `bottom-nav.scss`; the `.sd-frame {…}` block in `_global.scss` is the one that carries `env(safe-area-inset-bottom` for the regression spec, and it now also holds the mock's `.app-main` and `.container` rules.

### 2. Components carry the mock's BEM classes

Every component host carries the mock's block class and modifiers (`<sd-block class="block block--locked">`, `<sd-card class="card card--dimmed">`, `<sd-top-bar class="topbar">` …) and its inner elements carry the element classes verbatim from `docs/mocks-v2/styles/app.css`. Interactive atoms (`sd-button`, `sd-filter-chip`, `sd-ghost-row`, `sd-toggle`, `sd-checkbox`, `sd-list-item`) use a `display: contents` host so the real `<button>`, `<a>` or `<input>` carries the class and the accessible name. State is expressed the way the mocks express it: `aria-current="page"` on nav links and segments, `aria-pressed` on filter chips, votes, favourite and lock buttons, `aria-invalid` on fields, `role="switch"` on toggles.

The point is one locator set: the Playwright page objects work against the static mocks and the running app without a translation layer, and a pixel comparison of the two is meaningful.

### 3. Per-component encapsulated SCSS, copied from the mock stylesheet

Each component's SCSS is the matching block of `app.css` with `:host` / `:host(.modifier)` substitutions. Global SCSS holds only the reset, tokens and `sd-`-prefixed layout utilities (`.sd-frame`, `.sd-narrow`, `.sd-grid-days`, `.sd-grid-cards`, `.sd-vdivider` …). Single-use blocks (landing hero and steps, legal prose, the family grid, the review queue, the past strip, the dialogs gallery) live in the page that uses them. The production budget stays at 6kB warn / 10kB error per component style.

Two component-authoring rules came out of the port and are worth keeping:

- **Declare each `ng-content` slot once.** A component that renders `<a>` or `<button>` by condition must put its slots in one `<ng-template>` and render it with `ngTemplateOutlet` in both branches (`sd-button`, `sd-ghost-row`, `sd-list-item`). With the slots repeated per `@if` branch, Angular projects into one branch only and the anchor variant renders empty.
- **Slotted content inside `@if` needs one root node per block.** A `@if` that wraps several `[slot=…]` nodes loses the slot (NG8011); split it into one `@if` per node.

### 4. v2 route names with redirects

Routes are named for the screens (`/weekend`, `/ideas`, `/ideas/food`, `/ideas/events`, `/past`, `/family`, `/review-submissions`, `/sign-in`, `/create-account`, `/reset-password`, `/verify-email`, `/legal`). Every v1 path redirects (`/itinerary` → `/weekend`, `/restaurants` → `/ideas/food`, `/profile` → `/family`, `/login` → `/sign-in`, `/privacy` → `/legal#privacy` …) so emails, bookmarks and the backend-built share URL (`/sample-weekend?share=<token>`) keep working. The dialogs gallery (`/dialogs`) and the `?state=` overrides exist only when `environment.galleryRoutes` is true; the production environment file compiles them out.

### 5. The UI is adapted to the current API, and the mocks follow

No backend change shipped with the redesign. Where the design assumed an endpoint that does not exist, both the mock and the app were adapted so the mocks stay the source of truth: no "add to Saturday/Sunday" on Ideas cards (the planner places blocks; cards link to a map or the event page), a server-chosen swap instead of an alternatives list, an errand form of what / how long / which day with the placement read back by diffing the weekend, no unlock or reroll on restaurants, members as name + age with the role derived, single-day commitments, and client-side filtering for history and events. `docs/mocks-v2/README.md` keeps the list.

## Consequences

- Retired v1 code was deleted in the same change: pages, dialogs, components, their specs, `docs/mocks`, the v1 baselines and the screenshot scripts. The repository has one design.
- Visual parity is now checkable, and its policy is ADR-010.
- Pages that must render a static mock state (`weekend?state=empty`, `reset-password?state=sent` …) do so through the dev-only override, not through test-only branches in production code.
- The lib's spec suite asserts the class contract and ARIA state, so a renamed class fails a unit test before it fails a screenshot.
