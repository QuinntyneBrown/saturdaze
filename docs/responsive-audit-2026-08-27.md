# Responsive audit — 2026-08-27

Every routed screen, five viewports: **xsmall 320×568 · small 390×844 · medium 820×1180 · large 1440×900 · xlarge 1920×1080**. The three legacy e2e widths (390/820/1440) are the middle three; 320 and 1920 had never been exercised.

## How to run

```powershell
cd e2e
npm run audit:mocks   # mocks on :5173 (self-started) — no backend needed
npm run audit         # Angular app on :4200 — needs the API on :5100 (Start-FreshStack.ps1)
```

Screenshots land in `e2e/audit-output/{mocks,app}/<route>.<viewport>.png` (gitignored, ~110 per target; identical filenames for side-by-side review). Each capture also runs a measurement-based overflow sweep (`e2e/fixtures/overflow.ts`) — `html, body { overflow-x: clip }` masks horizontal overflow from screenshots, so geometry is measured, not eyeballed. The always-on guard is `e2e/tests/regression/no-horizontal-overflow.spec.ts` (runs with `npm run test:behavior`; loops all five widths under the desktop project).

## Findings

| # | Route(s) | Viewport(s) | Symptom | Root cause | Fix | Baseline risk | Status |
|---|---|---|---|---|---|---|---|
| F1 | activities, restaurants, saved, events, admin-events (mock) | xsmall, small | Document pans horizontally 20px | Mocks' `html, body` had no `overflow-x` rule; the app's `_global.scss` clip was never mirrored, so sd-tag-group's intentional full-bleed (`margin: 0 -20px`) made the whole mock page scrollable | `overflow-x: clip` added to `docs/mocks/styles/global.css` | None — clip has no visual effect at 390/820/1440 (bleed is design-intent; only the pan is removed) | fixed (mocks) |
| F2 | errand | xsmall, small | Whole form 503px wide on a 320/390 viewport; inputs and card cut off ~133px past the right edge. **The committed mobile baseline (`errand-full-mobile-win32.png`, 523×844) has this bug baked in** | `.errand-form { display: grid }` single implicit column = `minmax(auto, 1fr)`; sd-tag-group's unwrapped chip row (~500px min-content) forces the track wider than the frame | `grid-template-columns: minmax(0, 1fr)` — `docs/mocks/pages/errand.html` + `frontend/.../pages/errand/errand.page.scss` | **Yes — intentional**: errand mobile baselines must be recaptured from the fixed mock (`npm run baseline`) | fixed (both) |
| F3 | sample-weekend | xsmall, small | Header and main render side-by-side; page 462px wide at 320 | Mock page's `body` rule missed the `display: block` override, so the global phone-frame `display: flex` laid the page's top-level blocks out in a row below 720px | `display: block` added to the page's body rule (mock only — the app's `shell: 'splash'` body mode already does this) | None — no sample-weekend visual baselines exist | fixed (mock) |
| F4 | dialogs (gallery) | xsmall, small | Gallery column forced to ~424px, centered → clipped both sides | Same implicit-`1fr` grid defect as F2: a dialog's non-wrapping action row's min-content forces the column | `grid-template-columns: minmax(0, 1fr)` — `docs/mocks/pages/dialogs.html` + `frontend/.../pages/dialogs/dialogs.page.scss` | To verify in re-run (gallery baselines exist at 390) | fixed (both) |
| F5 | splash | xsmall | Hero column (min-content ~289px) overflows the 320 viewport; 44px h1 cramped | Bare `1fr` hero grid + no type tier below 720 | `minmax(0, 1fr)` both hero tiers; xsmall rung: hero h1 34px, padding 40/24; token retune `--sd-fs-xxl` 30 / `--sd-fs-xl` 24 / `--sd-app-pad-x` 16 at ≤379px | None — gated ≤379px, splash baselines are at 390+ | fixed (both) |
| F6 | all frame pages | xlarge | Desktop 1280px content cap never applied in the app — content stretches edge-to-edge past ~1580px viewports | `_global.scss` used `.sd-frame > sd-section` child combinators, but the router inserts the page host (`<app-home>` …) between frame and content, so the selector never matched (it worked in the mocks) | Descendant combinators + `.sd-frame > * { display: block }` (page hosts default to inline) — `_global.scss`; combinator mirrored in mock `global.css` for parity | None — cap only engages above ~1580px viewport (1440 − rail/gutters = 1140 < 1280); combinator change is a no-op in mocks (descendant ⊇ child) | fixed (both) |
| F7 | system-wide | xsmall | No layout tier below 720px other than the 440px frame cap | Breakpoint system had only `tablet`/`desktop` | `xsmall` branch (`max-width: 379px`) added to `respond-to()`; token retune added to `_tokens.scss` + mock `tokens.css` (see F5) | None — gated ≤379px, no baseline is narrower than 390 | fixed (both) |
| F8 | dialogs (all sheets) | xsmall | Dialog action-button pairs push past the sheet edge at 320 | `sd-dialog`'s `.actions` flex row never wrapped | `flex-wrap: wrap` — `docs/mocks/components/sd-dialog.js` + `frontend/.../components/src/lib/dialog/dialog.scss`. Buttons stack full-width only when they don't fit | None — wrap engages only below the point where buttons fit; 390+ unchanged | fixed (both) |
| F9 | admin-events | xsmall | Submission cards ~15px past the viewport | `.submission dl { grid-template-columns: 100px 1fr }` — long unwrappable `dd` values (URLs, emails) force the implicit-min track wide | `100px minmax(0, 1fr)` + `dd { overflow-wrap: anywhere }` — mock + `admin-events.page.scss` | None — engages only when values would overflow | fixed (both) |
| F10 | events/submit (app only) | xsmall | Entire form forced to 366px on a 320 viewport | App page uses **native inputs** (not the mock's `sd-text-input` shadow hosts); their ~180px intrinsic min-content propagates through three nested implicit-`1fr` grids (`.submit-form`, `.cost-and-ages`, `.field`) | `minmax(0, 1fr)` on all three + `width: 100%` on inputs — `events-submit.page.scss`. Mock already passed (shadow hosts isolate the intrinsic width) | None — at 390+ the columns already fit, so resolved tracks are identical | fixed (app) |
| F11 | splash | xsmall | Top-nav "Sign in" link wraps onto two lines at 320 | No `white-space` guard on `.nav-link` | `white-space: nowrap` — mock + app | None — link already fit on one line at 390+ | fixed (both) |

### Observation (not a defect)

At the tablet tier (720–1023) the rail brand wordmark ("✦ Saturdaze") renders wider than the 72px rail card. The app matches the mock pixel-for-pixel here — it is the designed baseline — so it is recorded as a design observation, not a responsive defect.

### Pre-existing suite conditions discovered

- Before any change in this audit, **all 177 visual tests were failing** with uniform sub-pixel ghosting on every glyph. Notably, recapturing baselines from the mocks left ~150 of ~170 PNGs byte-identical — so the mocks still match the committed baselines, and the ghosting is an app-vs-mock rendering difference, not baseline staleness. The Playwright update did break the `baseline` npm script's CLI syntax (`--update-snapshots` now takes a mode; fixed as `--update-snapshots all`).
- **The frontend Vitest suite has 35 pre-existing failures on main** (e.g. `HomePage > should render with stubbed children`: `ctx_r1.overview is not a function`). Verified by stashing this audit's CSS-only changes and re-running: identical failures on clean HEAD.

## Verification state (final)

- [x] `npm run audit:mocks` — **115/115 passed** at all five widths
- [x] `npm run audit` (app) — **111/111 passed**, 5 skipped (adminEvents: no Angular route)
- [x] `tests/regression/no-horizontal-overflow.spec.ts` — **passed** (22 routes × 5 widths, 18s; runs with `test:behavior`)
- [x] `tests/regression/bottom-nav-clearance.spec.ts` — **18/18 passed** (ADR-005; `_global.scss` was touched)
- [x] `npm run test:visual` — **no new failures**: 177 failing before this audit's changes and 177 after, for two pre-existing reasons unrelated to this work (see below). 17 baselines intentionally recaptured from the corrected mocks (F1/F2/F4 + drift from earlier mock edits that had landed without recapture)
- [x] `frontend: npm test` (Vitest) — 35 failures, **all pre-existing on main** (verified by stash + re-run on clean HEAD; this audit's changes are CSS-only)
- [—] `npm run test:behavior` full suite — fails for the same pre-existing reason as the visual suite (see below); the two regression guards above, which are part of it, pass

### Why the visual & behavior suites were already red (pre-existing, out of scope)

1. **No auth fixture**: visual and behavior specs `goto()` guarded routes with no session, so against the live app they bounce to `/login?returnUrl=…` and time out waiting for the page's components. Every `requireAuth` page's specs fail this way. The suites presumably last ran green before the auth guards landed (e2e runs nowhere in CI). The audit harness solves this for itself with a `storageState` setup project (`e2e/audit/auth.setup.ts`) — the same pattern can restore the main suites.
2. **Sub-pixel ghosting on anonymous pages**: app renders diff from mock captures by a sub-pixel offset on every glyph/border (both sides use the same Segoe UI fallback — neither loads Inter). Recapturing baselines from the mocks left ~150 of ~170 PNGs byte-identical, proving the mocks still match their baselines; the offset is app-vs-mock (likely the extra Angular host elements shifting fractional layout) and exceeds the tight 0.005 diff ratio.
