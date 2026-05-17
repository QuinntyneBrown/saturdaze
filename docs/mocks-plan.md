# Mocks plan — closing the button/link audit gap

**Date:** 2026-05-17
**Driving documents:**
- [docs/button-link-audit-2026-05-17.md](button-link-audit-2026-05-17.md) — discovery doc
- [docs/bugs/](bugs/) — `BUG-001` … `BUG-046`, one file per fix

## Why this plan exists

Every bug logged in `docs/bugs/` falls into one of three buckets:

| Bucket | Example | Mock work needed? |
|---|---|---|
| Pure wiring | `BUG-002` (`returnUrl` is on the URL but ignored) | **No** — the screen already exists. |
| New backend behaviour | `BUG-006` (`POST /api/auth/forgot-password` returns 404) | Sometimes — only if the response unlocks a new UI state. |
| Missing UI surface | `BUG-019` (Open mail app — there is no picker), `BUG-024` (lock-selection mode — no design for it) | **Yes** — the design has to come before the implementation. |

This plan enumerates every new mock surface required to back the third
bucket. The mocks under `docs/mocks/` are the **design source of truth**
(`e2e/tests/visual/*.visual.spec.ts` captures baselines from them with
`SD_BASELINE=1`), so a fix without a corresponding mock leaves the Angular
implementation with no review surface.

## Conventions (current repo, do not invent new ones)

- **Static dialog mocks** go into `docs/mocks/pages/dialogs.html` as
  `<sd-dialog open static …>` blocks behind a `.demo-label` header. Order
  inside the file is loose; new entries can append.
- **Page mocks** are full HTML files under `docs/mocks/pages/<route>.html`,
  using `<sd-top-bar>`, `<sd-section>`, `<sd-bottom-nav>` and the shared
  `styles/global.css` + `styles/tokens.css`.
- **State variants of an existing page** live as a sibling file
  `<route>.<state>.html` (e.g. `home.empty.html`) — keeps each state
  visually reviewable on its own and unambiguous to baseline against. The
  existing folder has no precedent for sibling state files; this plan
  proposes the convention and recommends adopting it once the first state
  mock lands.
- **New web components** are prototyped under `docs/mocks/components/`
  first (`sd-*.js`), then ported to
  `frontend/projects/components/src/lib/<name>/`. Selectors stay
  `sd-foo`; TS class / folder / file names drop the `Sd` prefix.

## Bugs that need no mock work (15 / 46)

These are pure-behaviour fixes — the screens already exist and the design
intent is unambiguous. Listed so reviewers know not to look for matching
mocks.

| Bug | Why no mock |
|---|---|
| `BUG-001` | Existing splash/login/weekend renders are sufficient; rehydration is invisible. |
| `BUG-002` | Login screen exists; only the navigation target changes. |
| `BUG-003` | Bottom-nav already designed; hrefs need to point at real routes. |
| `BUG-004` | Day-card already designed; href change only. |
| `BUG-011` | Action-row designs already exist in every affected dialog mock. The bug is `sd-dialog` projection — fix is in code. |
| `BUG-012`, `BUG-013`, `BUG-015`, `BUG-016` | Splash CTAs visually exist; only the click handlers need wiring. |
| `BUG-026`, `BUG-028` | "Open Saturday" / "Open full day" — route to the existing `itinerary.html` mock. |
| `BUG-037` | "See menu" is just an `<a target="_blank">` — no UI of our own. |
| `BUG-039` | "Back" affordance design already in `sd-top-bar back`. |
| `BUG-046` | Gallery hygiene — meta concern, no user-facing UI. |

## Bug → mock mapping (the other 31)

The table below is the master cross-reference. Each row is a mock surface
that does not exist today; the **Bugs** column shows every fix it
unblocks. Files appear under "New mocks needed" in priority order below.

| ID | Mock surface | Bugs | Kind |
|---|---|---|---|
| M-D1 | "Open mail app" picker dialog | `BUG-019` | dialog |
| M-D2 | "Open calendar" subscribe/export dialog | `BUG-020` | dialog |
| M-D3 | "Regenerate this day?" per-day confirm dialog | `BUG-027`, `BUG-029`, `BUG-031` | dialog |
| M-D4 | "See on map" dialog (or `/map` page — see M-P3) | `BUG-033` | dialog |
| M-D5 | "Surprise me — Try something new" dialog | `BUG-034` | dialog |
| M-D6 | "Remix this weekend?" confirm dialog | `BUG-041` | dialog |
| M-D7 | "Repeat this weekend — overwrite?" confirm dialog | `BUG-042` | dialog |
| M-D8 | Itinerary "More" action sheet | `BUG-030` | dialog |
| M-D9 | Saved "More" action sheet | `BUG-040` | dialog |
| M-D10 | Profile "More" action sheet (if kept) | `BUG-045` | dialog (decision) |
| M-D11 | Share dialog — copy-link variant | `BUG-021`, `BUG-025` | dialog (extension) |
| M-D12 | Restaurants "Lock it in" confirm | `BUG-038` | dialog |
| M-P1 | `/terms` page | `BUG-017` | page (decision) |
| M-P2 | `/privacy` page | `BUG-018` | page (decision) |
| M-P3 | `/map` page (alt. to M-D4) | `BUG-033` | page (decision) |
| M-P4 | `/sample-weekend` public page | `BUG-014` | page (decision) |
| M-S1 | `/forgot-password` — transport-error inline state | `BUG-010` | state |
| M-S2 | `/check-email` — with email context | `BUG-009` | state |
| M-S3 | `/check-email` — unknown-email entry state | `BUG-009` | state |
| M-S4 | `/verify-email` — in-progress / verifying state | `BUG-008` | state |
| M-S5 | `/verify-email` — success state | `BUG-008` | state |
| M-S6 | `/verify-email` — token-expired / invalid state | `BUG-008` | state |
| M-S7 | `/reset-password` — success state | `BUG-007` | state |
| M-S8 | `/reset-password` — token-expired / invalid state | `BUG-007` | state |
| M-S9 | `/weekend` — empty / first-weekend state | `BUG-022` | state |
| M-S10 | `/weekend` — generating / loading state | `BUG-022` | state |
| M-S11 | `/weekend` — lock-selection mode | `BUG-024` | state |
| M-S12 | `/itinerary` — Sunday-active variant | `BUG-005` | state |
| M-S13 | `/itinerary` — locked-day chip variant | `BUG-032` | state |
| M-S14 | `/restaurants` — refresh loading state | `BUG-035` | state |
| M-S15 | `/restaurants` — voted card state (Yes / No active) | `BUG-036` | state |
| M-S16 | `/restaurants` — family consensus indicator | `BUG-036` | state |
| M-S17 | `/restaurants` — locked card state | `BUG-038` | state |
| M-S18 | `/errand` — alternate-slot picker state | `BUG-043` | state |
| M-S19 | `/errand` — submit success / saved state | `BUG-044` | state |

> **Already covered by existing mocks** — verified during plan write-up,
> no work required:
> - `BUG-023` (regenerate-whole-weekend confirm) — exists in
>   `dialogs.html` (line 89, "Regenerate confirm").
> - `BUG-021`/`BUG-025` (share toolbar/quick-action) — base share dialog
>   exists in `dialogs.html` (line 294, "Share for Sara's approval"); M-D11
>   only needs to add a "copy link" affordance to it, not redo it.
> - `BUG-036` vote-row component — `sd-vote-row` already exists in
>   `dialogs.html` line 148; M-S15/M-S16 only need page-level placement.
> - `BUG-044` shopping-errand form layout — exists in `dialogs.html`
>   (line 242, "Shopping errand quick-add"); M-S19 is the post-submit
>   confirmation, not the form itself.

## New mock surfaces — detailed specs

### Dialog mocks (12 entries, all appended to `docs/mocks/pages/dialogs.html`)

#### M-D1 — Open mail app picker (`BUG-019`)
- **Title:** "Open your mail app"
- **Subtitle:** "Pick where to look."
- **Body:** four list items — Gmail (web), Outlook (web), Apple Mail
  (`mailto:`), "Default mail app" (`mailto:` fallback). Each row has a
  leading provider icon and a trailing `chevron_right`.
- **Actions:** secondary `Cancel`.
- **Notes:** mobile-first; on a real device most of these become deep
  links. The dialog itself is presentational; the routing decisions are
  in `check-email.page.ts`.

#### M-D2 — Open calendar (`BUG-020`)
- **Title:** "Add this weekend to your calendar"
- **Subtitle:** "Subscribe to keep it in sync, or download just this one."
- **Body:** a `sd-card variant="sunk"` block with three list items —
  "Subscribe (webcal://…)", "Open in Google Calendar", "Download .ics".
  A `sparkle` icon note: "Subscribed calendars update when I regenerate."
- **Actions:** secondary `Close`.

#### M-D3 — Regenerate this day (`BUG-027`, `BUG-029`, `BUG-031`)
- **Title:** "Regenerate Saturday?" (parametric on day)
- **Subtitle:** "Locked blocks stay put."
- **Body:** reuse the locked-block card from the existing whole-weekend
  regenerate dialog but scope the list to one day.
- **Actions:** secondary `Cancel`, primary `Regenerate` with `refresh`
  icon.
- **Notes:** mirror the existing `Regenerate confirm` dialog (`dialogs.html`
  line 89). Two demos in the gallery is fine (Saturday + Sunday).

#### M-D4 — See on map (`BUG-033`)
- **Title:** "Saturday on a map" / "Sunday on a map"
- **Subtitle:** day total drive time
- **Body:**
  - a static map placeholder (`<div class="map-stub">` styled like the
    rest of the mocks — checker pattern or grey block at 16:9, with three
    coloured pins overlaid)
  - a list of stops (`sd-list-item`) with leading map pin icon,
    title = block name, subtitle = address + drive time, trailing
    `chevron_right`
- **Actions:** secondary `Close`, primary `Open in Google Maps` with
  `share` icon (external link).
- **Notes:** if the team chooses page route (M-P3) over dialog, this is
  the alternative — pick one.

#### M-D5 — Surprise me (`BUG-034`)
- **Title:** "Try something new this weekend"
- **Subtitle:** "I'll lean into things you haven't done lately."
- **Body:** four `sd-list-item` activities with leading icons (`tree`,
  `popcorn`, `ticket`, `bike`), each with a trailing `swap` icon. A
  `sparkle` note: "Filtered by your likes + the weather."
- **Actions:** secondary `Cancel`, ghost `Reshuffle`, primary `Add to
  weekend`.

#### M-D6 — Remix confirm (`BUG-041`)
- **Title:** "Remix Mom's Birthday Weekend?"
- **Subtitle:** "I'll keep the family vibe but try new spots."
- **Body:** a `sd-card variant="sunk"` with `sparkle` icon: "Same Sara,
  same kids, fresh restaurants, similar pace." Three preview chips
  ("Brunch · new", "Activity · new", "Dinner · keep").
- **Actions:** secondary `Cancel`, primary `Remix it` with `sparkle`
  icon.

#### M-D7 — Repeat overwrite (`BUG-042`)
- **Title:** "Use this weekend as the current plan?"
- **Subtitle:** "It will replace your current draft."
- **Body:** `sd-card variant="sunk"` listing what gets overwritten
  (current weekend) and what is kept (locks, family commitments, saved
  list).
- **Actions:** secondary `Cancel`, danger `Replace current`. (Danger
  variant because it's destructive of the current draft.)

#### M-D8 — Itinerary "More" action sheet (`BUG-030`)
- **Title:** "More" (or unlabeled — sheet style)
- **Body:** four `sd-list-item` rows: "Share this day…", "Add to
  calendar…", "Export as text", "Reset day".
- **Actions:** secondary `Close`.
- **Notes:** action-sheet style — no header subtitle, no primary CTA.

#### M-D9 — Saved "More" action sheet (`BUG-040`)
- **Title:** unlabeled
- **Body:** rows: "Sort by date", "Sort by family rating", "Filter…",
  "Export all".
- **Actions:** secondary `Close`.

#### M-D10 — Profile "More" action sheet (`BUG-045`, decision required)
- **Open question:** the sign-out plan (`docs/sign-out-plan.md` D4)
  defers a second top-bar action; the simplest fix may be to remove the
  button entirely. Only design this if product decides it stays.
- **If kept:** rows for "About", "Help", "Delete account", with
  destructive styling on the last.

#### M-D11 — Share dialog with copy-link affordance (`BUG-021`, `BUG-025`)
- **Extension** of the existing `Share for Sara's approval` dialog
  (`dialogs.html` line 294). Add:
  - a code-style row showing the share URL (`https://saturdaze.app/s/abc123`)
  - a trailing `copy` icon button (new glyph needed in `sd-icon.js`)
  - a secondary action `Copy link` next to the existing `Send` button.
- **Notes:** the new `copy` glyph needs to be added to both
  `docs/mocks/components/sd-icon.js` and
  `frontend/projects/components/src/lib/icon/icon.ts`.

#### M-D12 — Restaurants "Lock it in" confirm (`BUG-038`)
- **Title:** "Lock La Marina for Saturday lunch?"
- **Subtitle:** "I'll stop suggesting alternatives for this slot."
- **Body:** a thin `sd-card variant="sunk"` echoing the chosen restaurant
  (`sd-icon name="fork"`, name, neighborhood, party size). A note that
  votes will be preserved.
- **Actions:** secondary `Not yet`, primary `Lock it in` with `lock` icon.

### Page mocks (4 entries, all under `docs/mocks/pages/`)

#### M-P1 — `/terms` (`BUG-017`, decision required)
- **File:** `docs/mocks/pages/terms.html`
- **Layout:** `sd-top-bar back="true"` with title "Terms" → a single
  centred narrow column with H1 "Terms of Service", a "Last updated
  2026-05-17" sub-line, and dummy section headings (`Acceptance`,
  `Your account`, `Content`, `Termination`, `Contact`).
- **Decision:** product picks between (a) ship this internal page,
  (b) link to an external policy URL, (c) hide the link until legal
  is ready. Only build M-P1 under (a).

#### M-P2 — `/privacy` (`BUG-018`, decision required)
- **File:** `docs/mocks/pages/privacy.html`
- Same layout as M-P1; section headings: `What I collect`, `How I use
  it`, `Sharing`, `Your choices`, `Contact`.
- **Decision:** same three options as M-P1.

#### M-P3 — `/map` page (`BUG-033`, decision required)
- **File:** `docs/mocks/pages/map.html`
- **Layout:** `sd-top-bar back="true" title="Saturday route"`; a large
  map stub filling the top 60% of the viewport with three pins; below it
  a vertical stop-list reusing `sd-list-item`. Bottom toolbar with
  `Open in Google Maps` deep-link button.
- **Decision:** ship M-P3 *or* M-D4, not both. M-D4 is lower scope; M-P3
  is the more polished experience.

#### M-P4 — `/sample-weekend` (`BUG-014`, decision required)
- **File:** `docs/mocks/pages/sample-weekend.html`
- **Layout:** the same shell as `home.html` but with a banner
  ("This is a sample. Sign up to make one for your family.") and the
  bottom-nav replaced with a single full-width CTA "Create your
  account". Anonymous-safe — must not require auth.
- **Decision:** product picks one of three behaviours from
  [`BUG-014`](bugs/BUG-014.md). Only build M-P4 if the public-route
  option is chosen.

### Page-state variants (19 entries)

These are siblings of an existing page mock, named
`<route>.<state>.html`. The convention is **new** — recommend adopting
once the first variant lands so the visual baselines stay deterministic.

| ID | File | Diff from base mock |
|---|---|---|
| M-S1 | `forgot-password.error.html` | Inline `sd-card` error banner above the form: "Couldn't send the reset link. Try again in a minute." Submit button re-enabled. |
| M-S2 | `check-email.with-email.html` | "Sent to **q\*\*\***@gmail.com" line under the title; `Resend` button enabled. |
| M-S3 | `check-email.empty.html` | Inline email entry field where the "Sent to …" line would be; `Resend` disabled until valid. |
| M-S4 | `verify-email.verifying.html` | Sparkle/spinner icon + "Verifying your email…" copy; CTA hidden. |
| M-S5 | `verify-email.success.html` | Leaf-tone success card "You're verified" + primary CTA "Go to my weekend". |
| M-S6 | `verify-email.expired.html` | Warn-tone error card "Link expired" + CTA "Send a new link". |
| M-S7 | `reset-password.success.html` | Success card "Password updated" + primary CTA "Sign in". |
| M-S8 | `reset-password.expired.html` | Warn-tone error card "Reset link expired" + CTA "Back to forgot password". |
| M-S9 | `home.empty.html` | First-run state — hero "Plan your first weekend" + a full-width `Plan This Weekend` CTA. No day cards. |
| M-S10 | `home.generating.html` | Skeleton day cards with shimmer; hero text "Thinking through Saturday…". |
| M-S11 | `home.lock-mode.html` | Day cards switch each block to a row with a lock-toggle trailing icon. Footer toolbar with `Done` + `Cancel`. |
| M-S12 | `itinerary.sunday.html` | Same itinerary mock but the Sunday switcher pill is active and the block list shows Sunday content. |
| M-S13 | `itinerary.locked-day.html` | The day switcher's active pill carries a small `lock` icon; an in-page banner notes "Saturday is locked — regenerate won't touch it." |
| M-S14 | `restaurants.refreshing.html` | Three skeleton restaurant cards; the `Refresh picks` button shows a spinner. |
| M-S15 | `restaurants.voted.html` | Two cards show `Yes` selected (primary fill), one shows `No`. |
| M-S16 | `restaurants.consensus.html` | A consensus row at the top of each card: 4 small avatars + thumb-icons (mirrors the `sd-vote-row` design from the existing dialog). |
| M-S17 | `restaurants.locked.html` | One card is "locked" — full-bleed leaf chip "Locked", reduced-opacity siblings, vote buttons disabled. |
| M-S18 | `errand.alt-slots.html` | A scrollable chip row of alternate time slots appears between the form and the CTA; the chosen slot is the primary chip, the rest are secondary. |
| M-S19 | `errand.added.html` | A leaf-tone success card "Added to Saturday 3–4pm" replaces the form; primary CTA "Back to weekend". |

### Components / glyphs to add

- New icon glyph: `copy` (used by M-D11). Two-file change:
  `docs/mocks/components/sd-icon.js` and
  `frontend/projects/components/src/lib/icon/icon.ts`.
- Possibly new icon glyph: `map_pin` (used by M-D4 / M-P3). Verify whether
  the existing `map` glyph is sufficient.
- Possibly new component: `sd-map-stub` — a small JS component that
  renders the placeholder map (gradient bg + pins) used by M-D4 / M-P3.
  If only one mock surface ends up using it, inline the markup instead.

## Sequencing

Build the mocks in the same order the bugs will ship — that way each
implementation PR has its mock baseline ready when it lands.

### Phase 1 — high-severity / blocking (lands with the corresponding bug fix)

- **M-S1** ([BUG-010](bugs/BUG-010.md) forgot-password fake success)
- **M-S2**, **M-S3** ([BUG-009](bugs/BUG-009.md) check-email resend)
- **M-S4**, **M-S5**, **M-S6** ([BUG-008](bugs/BUG-008.md) verify-email)
- **M-S7**, **M-S8** ([BUG-007](bugs/BUG-007.md) reset-password)

### Phase 2 — core product behaviours (medium severity, broad reach)

- **M-S9**, **M-S10** ([BUG-022](bugs/BUG-022.md) Plan This Weekend)
- **M-S11** ([BUG-024](bugs/BUG-024.md) lock selection)
- **M-S12**, **M-S13** ([BUG-005](bugs/BUG-005.md), [BUG-032](bugs/BUG-032.md))
- **M-D3** (per-day regenerate)
- **M-S14**, **M-S15**, **M-S16**, **M-S17** (restaurants loop)
- **M-D11** (share copy-link extension)
- **M-D12** (restaurants lock-in confirm)
- **M-D6**, **M-D7** (remix / repeat saved-weekend loop)

### Phase 3 — secondary UX (medium / low severity)

- **M-D1** (mail picker)
- **M-D2** (calendar)
- **M-D4** *or* **M-P3** (see on map — pick one)
- **M-D5** (surprise me)
- **M-D8**, **M-D9** (More action sheets)
- **M-S18**, **M-S19** (errand slot picker / success)

### Phase 4 — decision-required, then build

These need a product call before they cost design time:

| Mock | Decision needed |
|---|---|
| **M-D10** | Keep or remove the Profile "More" button? |
| **M-P1** | Internal `/terms` page, external link, or hide? |
| **M-P2** | Same three options for `/privacy`. |
| **M-P3** vs **M-D4** | Map page or map dialog? |
| **M-P4** | Build the sample-weekend page, or pick a different `BUG-014` resolution? |

## Tooling notes

- After each new mock lands, regenerate the visual baselines with
  `SD_BASELINE=1` from `e2e/` and review the resulting screenshots before
  committing them. The mocks-driven visual specs are what catch UI
  regressions in CI.
- The `docs/mocks/.verify.mjs` script renders each `docs/mocks/pages/*.html`
  with Playwright and snapshots it under `docs/mocks/.screenshots/`. New
  page mocks will be picked up automatically; new state-variant files
  will too as soon as the convention is wired in (it currently globs
  `pages/*.html`, which already matches the proposed naming).
- For state variants, prefer a single small `sd-empty`/`sd-card`-built
  state difference over a fully duplicated mock. Less drift over time.

## What this plan deliberately does not do

- **Does not** specify visual styling beyond what the existing mocks
  already standardise. Tokens (`tokens.css`), tones, and chip palette
  carry forward unchanged.
- **Does not** propose new layouts for screens whose existing mock is
  already sufficient (splash, signup, login, profile, components gallery,
  events).
- **Does not** schedule the implementation work itself — that lives in
  each `BUG-NNN.md` Acceptance section.
