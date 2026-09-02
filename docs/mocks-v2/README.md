# Saturdaze mocks v2

Static HTML mocks for Saturdaze redesigned as a **responsive web app first** with a
**radically simple feature set**. Five core screens, one primary action each; every
capability the product has today keeps a home, nothing new was added.

Open `index.html` in a browser and resize the window: **720px** swaps the phone
bottom nav for a top bar, **1024px** puts Saturday and Sunday side by side.

## What's here

```
index.html            launcher
app.js                the only script: icon sprite, ADR-005 bottom-chrome tracking,
                      scrolled top bar, legal.html Terms/Privacy switch
styles/tokens.css     VERBATIM copy of design-system/assets/tokens.css + provenance header
styles/app.css        everything else, in @layer order (reset → base → shell → layout →
                      components → pages → utilities)
pages/_shell.html     the canonical skeleton every page copies (not a screen)
pages/*.html          18 screens (list below)
.check.mjs            static consistency check, no dependencies
.verify.mjs           Playwright: 5 widths, overflow walker, shell checks, screenshots
screenshots/          committed <slug>.<viewport>.png captures (390 / 820 / 1440)
.screenshots/         debug captures from .verify.mjs (gitignored)
```

| Screen | File(s) |
| --- | --- |
| Weekend (home + itinerary merged) | `weekend.html`, `weekend.empty.html`, `weekend.generating.html` |
| Ideas (activities · food · events) | `ideas.html`, `ideas.food.html`, `ideas.events.html` |
| Past weekends | `past.html`, `past.empty.html` |
| Family | `family.html` |
| Review submissions (admin) | `review-submissions.html`, `review-submissions.empty.html` |
| Auth | `sign-in.html` (2 states), `create-account.html`, `reset-password.html` (5 states), `verify-email.html` (3 states) |
| Public | `landing.html`, `legal.html` (Terms + Privacy) |
| Dialogs gallery | `dialogs.html` (D1–D26 rendered inline) |

## Running the checks

From the repo root (pwsh or bash). Playwright is resolved from `e2e/node_modules`, so
run `npm ci` in `e2e/` once.

```powershell
node docs/mocks-v2/.check.mjs               # static consistency, <1s, run this first
node docs/mocks-v2/.verify.mjs              # self-serves on :5180, checks 5 widths, writes .screenshots/
node docs/mocks-v2/.verify.mjs --capture    # + full-page PNGs into screenshots/<slug>.<viewport>.png
```

If Chromium fails to launch: `cd e2e; npx playwright install chromium`.

To browse manually side by side with v1 (which stays on :5173):

```powershell
cd e2e
npx http-server ../docs/mocks-v2 -p 5180 -c-1 --cors
# reuse that server for the verifier:
$env:SD_MOCKS_URL = "http://localhost:5180"; node ..\docs\mocks-v2\.verify.mjs
```

`-c-1` disables http-server caching. Pages also open directly from `file://`
(the icon sprite is injected by `app.js`, so nothing needs a server).

### What `.check.mjs` enforces

1. The three shell regions (`@shell:head`, `@shell:topbar`, `@shell:bottomnav`) of every
   app page match `pages/_shell.html` after normalisation; bare pages carry only the head.
2. `styles/tokens.css` is byte-identical to `design-system/assets/tokens.css` after its
   provenance header.
3. No `<style>` blocks or `style=""` attributes anywhere under `pages/`.
4. Every launcher tile resolves to a file, and every page has a tile.
5. Every `<use href="#i-…">` matches a symbol in `app.js`; every relative link resolves.
6. The ADR-005 clearance calc is present in `app.css`, `viewport-fit=cover` in the shell,
   and `trackBottomChrome` in `app.js`.
7. Every `<a>` and `<button>` has a name; specimen and state ids are unique.

### What `.verify.mjs` checks, per page × width (320 / 390 / 820 / 1440 / 1920)

HTTP 2xx for the page and every subresource · expected text present · zero console
errors · **no horizontal overflow** (scrollWidth plus an element walker ported from
`e2e/fixtures/overflow.ts`, because `overflow-x: clip` hides overflow from scrollWidth) ·
the right nav is visible for the width with `aria-current` on the right link · expected
grid column counts where declared.

## Adding or editing a page

1. Copy `pages/_shell.html`. Edit exactly three things: the `<title>`, the two body
   attributes (`data-page="<route>"`, `data-shell="app|bare"`), and which nav link
   carries `aria-current="page"`. Fill `<main>`.
2. Put any route-specific CSS in `styles/app.css` under `@layer pages`, scoped by
   `body[data-page="<route>"]`. Never in the page.
3. Add a tile to `index.html` and a row to the `PAGES` table in `.verify.mjs`.
4. Run `.check.mjs` then `.verify.mjs`.

Naming: kebab-case; one extra dot for a state or segment (`weekend.empty.html`,
`ideas.food.html`). State lives in ARIA (`aria-current`, `aria-pressed`, `aria-invalid`,
`:checked`), variants in BEM-ish modifiers (`.chip--sun`, `.card--locked`). Every grid
track is `minmax(0, 1fr)`. Hover only under `@media (hover: hover)`. Focus rings are
outlines.

Design tokens are **never** edited here. v2-only layout tokens (content width, z ladder,
focus ring, tone pairs) live at the top of `app.css` in `@layer base`.

## v1 → v2 screen map

| v1 (`docs/mocks/pages/`) | v2 |
| --- | --- |
| `home.html`, `itinerary.html`, `itinerary.sunday.html` | `weekend.html` (Sat + Sun together; day switcher gone) |
| `home.empty.html` | `weekend.empty.html` |
| `home.generating.html` | `weekend.generating.html` |
| `home.lock-mode.html` | per-block lock buttons on `weekend.html`; no separate mode |
| `itinerary.locked-day.html` | `.day--locked` styling on `weekend.html` (not shown as a page) |
| `activities.html` | `ideas.html` |
| `restaurants.html`, `.voted`, `.consensus`, `.locked`, `.refreshing` | `ideas.food.html` (voted, locked and top-pick states on one page; refreshing dropped) |
| `events.html` | `ideas.events.html` |
| `events.submit.html`, `events.submitted.html` | dialogs D10 / D11 (spec revision L1-018: dedicated screen → dialog) |
| `errand.html`, `errand.alt-slots.html`, `errand.added.html` | dialogs D7 / D9 (D8 slot picker retired: the API places the errand itself) |
| swap alternatives (v1 block dialog) | D1 "Swap for something else" (D2 retired: the API chooses the replacement) |
| `saved.html` | `past.html`, `past.empty.html` |
| `profile.html` | `family.html` |
| `admin.events.html` | `review-submissions.html`, `review-submissions.empty.html` |
| `splash.html` | `landing.html` |
| `sample-weekend.html` | **dropped** (user decision) |
| `login.html` | `sign-in.html` |
| `signup.html` | `create-account.html` |
| `forgot-password.html`, `.error`, `check-email.html`, `.with-email`, `.empty`, `reset-password.html`, `.success`, `.expired` | `reset-password.html` (five stacked states) |
| `verify-email.html`, `.verifying`, `.expired` | `verify-email.html` (three stacked states) |
| `terms.html`, `privacy.html` | `legal.html` |
| `dialogs.html` | `dialogs.html` |
| `components.html` | **dropped** (the design-system catalog owns components) |

Dropped on purpose (no requirement behind them): open-mail-app picker, webcal / Google
Calendar rows, Friday-preview sheet, send-to-Sara, see-on-map, surprise-me, Saved "More"
sheet, export-as-text, day options sheet, day totals, heads-up cards, quick-actions list.

Adapted to the API as it is (no backend changes): no "Add to Saturday / Sunday" on Ideas
cards (activity cards link to a map, event cards to their details); swap is server-chosen
(D2 retired); the errand dialog asks What / How long / Which day and the planner picks
the slot (D8 retired, no detour figure); no Unlock, Refresh picks or Patio on Food;
members are name + age (role derived from age, no notes); commitments are one day each
with no place; the verify-email page gains a "Check your email" state for the moment
right after creating an account.

The `?state=` query override the Angular app honours in development mirrors the mock
state files and `#state-*` ids one to one (`weekend?state=empty`, `sign-in?state=error`,
`reset-password?state=sent`, …).

## Follow-ups (not part of this folder)

1. ~~Point the e2e baseline server at v2~~ — done with the Angular implementation.
2. ~~Remap `e2e/fixtures/routes.ts`~~ — done with the Angular implementation.
3. ~~Re-capture visual baselines~~ — done with the Angular implementation.
4. Revise L1-018 (dedicated submit-event screen → dialog).
5. ADRs for the shell change and the visual parity policy.
6. ~~Retire `docs/mocks`~~ — done with the Angular implementation.
