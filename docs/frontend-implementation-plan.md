# Saturdaze — frontend implementation plan

Turn `docs/mocks/` into the production Angular app at `frontend/`, vertical slice at a time, ATDD-driven. Speed is not a goal; radical simplicity is.

---

## 0. Current state (May 2026)

- `docs/mocks/` — canonical design. Skeleton already works mobile + tablet + desktop, verified end-to-end via Playwright. **Read this before writing any component**: the mock for the thing you're building is the spec.
- `frontend/` — Angular 21 workspace, three projects scaffolded:
  - `projects/api` — library, prefix `lib`. Currently contains a placeholder `lib-api` component to delete.
  - `projects/components` — library, prefix `lib`. Currently contains a placeholder `lib-components` component to delete.
  - `projects/saturdaze` — application, prefix `app`, SCSS configured. App template still has the Angular starter content.
- `e2e/` (workspace root, **not** under `frontend/`) — standalone Playwright package, already scaffolded:
  - `playwright.config.ts` — two-mode: `SD_BASELINE=1` serves `docs/mocks` at :5173; default boots `ng serve` from `../frontend` at :4200. Three viewport projects (mobile 390×844, tablet 820×1180, desktop 1440×900).
  - `fixtures/routes.ts` + `fixtures/sd-test.ts` — route map and the shared test fixture.
  - `pages/<screen>.page.ts` — POM per screen, selectors mirror the mock custom-element tag names.
  - `tests/<screen>.spec.ts` — one failing spec per screen (home, itinerary, activities, restaurants, saved, events, errand, profile, dialogs, components, plus a navigation spec). These are the ATDD targets.
  - `tests/visual/<screen>.visual.spec.ts` — pixel-diff specs using `toHaveScreenshot()`.
  - npm scripts: `test`, `test:visual`, `test:behavior`, `baseline` (captures snapshots from the mock), `report`.
  - Own `node_modules` — Playwright, cross-env, http-server, typescript live here, **not** in `frontend/package.json`.
- Stack: Angular 21.2, RxJS 7.8 (avoid in app code), Playwright 1.50, Vitest 4 for unit, ng-packagr 21.

---

## 1. The shape of the work

Each mock screen becomes one vertical slice. A slice cuts through all three projects:

- **`projects/components`** — every UI atom (`sd-button`, `sd-hero`, `sd-timeline-block`, …) one Angular component each, file-per-type (`.ts` / `.html` / `.scss`). Design tokens live here as SCSS partials so every component pulls from the same palette / spacing scale.
- **`projects/api`** — TypeScript models (`WeekendPlan`, `Day`, `Block`, `Restaurant`, …) and services (`WeekendPlanService`, `RestaurantService`, …). Static in-memory data until a real backend exists; the service interface stays the same when we swap.
- **`projects/saturdaze`** — thin application: `main.ts`, `app.config.ts`, `app.routes.ts`, one page-shell component per screen (`home.page.ts`, `itinerary.page.ts`, …). Pages compose components and bind to services. **No domain logic, no styling beyond layout, no UI atoms.**

---

## 2. Conventions — non-negotiable

### 2.1 Selector parity with mocks

Every component uses the **same tag name** as the mock custom element:

```ts
@Component({ selector: 'sd-hero', /* … */ })
```

This means one POM, one set of e2e selectors, works against both the mock baseline and the Angular implementation. **It is also how visual regression baselines stay valid** when we re-capture from the mock vs the Angular app.

### 2.2 Host-attribute mirroring

Angular consumes template attributes into properties; they vanish from the DOM. The mocks (and several e2e assertions like `toHaveAttribute('greeting', /…/)`) rely on attributes being **present on the host element**. Mirror every input to a host attribute:

```ts
@Component({
  selector: 'sd-hero',
  host: {
    '[attr.greeting]': 'greeting()',
    '[attr.subtitle]': 'subtitle()',
    '[attr.cta]':      'cta()',
  },
})
export class SdHero {
  readonly greeting = input<string>('Morning, Browns');
  readonly subtitle = input<string>('');
  readonly cta      = input<string>('Plan This Weekend');
}
```

For boolean attributes (`locked`, `full`, `back`, `wifeapproved`, `favourite`, `static`), bind to attribute presence:

```ts
host: { '[attr.locked]': 'locked() ? "" : null' }
```

### 2.3 Slots → `ng-content`

The mocks use named slots (`<slot name="chips">`, `<slot name="leading">`, …). Translate directly:

```html
<!-- sd-day-card.html -->
<a [href]="href()">
  …
  <div class="footer"><ng-content select="[slot=chips]" /></div>
</a>
```

Consumers write the same markup against either world:

```html
<sd-day-card day="Saturday" highlight="Lavender fields">
  <sd-chip slot="chips" tone="leaf">Outdoor day</sd-chip>
</sd-day-card>
```

### 2.4 Signals over RxJS

- Component state → `signal()`
- Component inputs → `input()` / `input.required()`
- Derived values → `computed()`
- Side effects → `effect()` (sparingly; almost never needed)
- HTTP → `httpResource()` (Angular 21) or wrap RxJS at the api-project boundary only

RxJS is permitted **inside `projects/api`** as an implementation detail; consumers see only signals.

### 2.5 File-per-type

Every component is a folder with three files:

```
projects/components/src/lib/sd-hero/
  sd-hero.ts
  sd-hero.html
  sd-hero.scss
```

No `template:` or `styles:` inline strings.

### 2.6 Standalone everything

- No `NgModule`. Every component / page is `standalone: true` (default in v21).
- Components declare their own `imports: […]`.
- Routes use `loadComponent` for lazy loading where the chunk is non-trivial.

### 2.7 Design tokens

Port `docs/mocks/styles/tokens.css` to SCSS partials in `projects/components`:

```
projects/components/src/lib/styles/
  _tokens.scss        // CSS custom properties under :root + SCSS vars
  _breakpoints.scss   // $bp-tablet: 720px; $bp-desktop: 1024px; respond-to() mixin
  _global.scss        // .sd-frame, .sd-card-grid, body resets
  index.scss          // forwards the above
```

The app bootstrap (`projects/saturdaze/src/styles.scss`) `@use`s `index.scss` so every component sees `var(--sd-bg)` etc. Components consume tokens via CSS custom properties; **never hard-code a hex value**.

### 2.8 Radical-simplicity guardrails

- No NgRx / Akita / signal-store library — `signal` + `computed` are enough for the whole app.
- No `OnInit` — use `effect()` if you must, or compute on render.
- No form library for the skeleton — `input()` two-way with `[value]` + `(input)` handlers.
- No interceptors, guards, resolvers until a real feature requires one.
- No utility packages (lodash, date-fns) until a real feature requires one. Date formatting is a one-liner in Intl.

---

## 3. ATDD loop (per slice)

All commands are run from `C:\projects\saturdaze\e2e\` unless noted.

1. **RED** — read or extend `tests/<screen>.spec.ts` (the failing assertion is already there for every screen). From `e2e/`, run `npm run test:behavior -- tests/<screen>.spec.ts` — it fails.
2. **GREEN** — implement the smallest scaffold: components in `frontend/projects/components`, model + service in `frontend/projects/api`, page composition in `frontend/projects/saturdaze`. Re-run — it passes.
3. **VISUAL** — once a slice's behaviour passes, capture the baseline once from the mocks (`npm run baseline -- tests/visual/<screen>.visual.spec.ts`), then `npm run test:visual -- tests/visual/<screen>.visual.spec.ts` diffs the Angular implementation against it. Tolerance: `maxDiffPixelRatio: 0.005`, `threshold: 0.05`.
4. **BUILD** — from `frontend/`: `ng build saturdaze && ng build components && ng build api` all clean.
5. **COMMIT** — one slice per commit. Include the e2e diff in the PR description.

---

## 4. Phased slices

Phases are ordered so the most-shared components land first. Each phase names the failing test it makes pass and the components it introduces.

### Phase 0 — Foundation (no user-visible output)

**Goal:** every later phase is unblocked. The e2e scaffold already exists at `e2e/`, so Phase 0 is mainly about getting the Angular side ready to receive the first vertical slice.

1. **Capture the visual baselines from the mocks**, once, before any Angular changes:

   ```
   cd C:\projects\saturdaze\e2e
   npm install
   npm run baseline
   ```

   This boots the mock http-server, takes per-viewport screenshots for every visual spec, and writes them into `tests/visual/<spec>.spec.ts-snapshots/`. **Commit those snapshots.** Every later slice diffs against them.

2. **Delete the Angular placeholder content:**
   - `frontend/projects/api/src/lib/api.ts` + `api.spec.ts` (replace later with real models/services)
   - `frontend/projects/components/src/lib/components.ts` + `components.spec.ts` (replace with the real component catalogue)
   - The Angular starter markup inside `frontend/projects/saturdaze/src/app/app.html`

3. **Replace `app.html`** with the app shell:

   ```html
   <div class="sd-frame">
     <router-outlet />
     <sd-bottom-nav active="home" />
   </div>
   ```

   `sd-bottom-nav` is the first real component implemented in this phase — it is reused on every page, so landing it now removes friction from Phases 1-9.

4. **Port the design tokens** to SCSS partials in `frontend/projects/components/src/lib/styles/`:
   - `_tokens.scss` — translate `docs/mocks/styles/tokens.css` to CSS custom properties (declared under `:root`) plus SCSS vars where helpful.
   - `_breakpoints.scss` — `$bp-tablet: 720px;`, `$bp-desktop: 1024px;`, a `@mixin respond-to($size)` helper.
   - `_global.scss` — `.sd-frame` responsive shell, `.sd-card-grid` utility, body resets, all matching `docs/mocks/styles/global.css`.
   - `index.scss` — `@forward` the three partials.

5. **Wire global styles** — `frontend/projects/saturdaze/src/styles.scss` `@use`s the components-library styles entry. Add a `paths` mapping in `frontend/tsconfig.json` so `@components` resolves to `projects/components/src/public-api.ts`, and a Sass `loadPaths` entry (in `angular.json` `stylePreprocessorOptions`) so `@use 'components/styles'` resolves to `projects/components/src/lib/styles/index.scss`.

6. **Implement `sd-bottom-nav`** in `frontend/projects/components/src/lib/sd-bottom-nav/` (three files; signal-input `active`; host attr mirror; the responsive CSS from `docs/mocks/components/sd-bottom-nav.js` ported to SCSS using the breakpoint mixin). Export it from `public-api.ts`.

7. **Run the existing navigation spec:**

   ```
   cd C:\projects\saturdaze\e2e
   npm run test:behavior -- tests/navigation.spec.ts
   ```

   It should go GREEN once Phase 0 is complete. Until then it stays RED, which is the desired starting state.

**Output:** `tests/navigation.spec.ts` passes against the Angular app. Three `ng build`s clean. Visual baselines captured and committed. No screen content yet — that's Phase 1.

---

### Phase 1 — Home / "This Weekend"

The largest slice — sets the pattern for everything else.

**Failing test (already authored):** `e2e/tests/home.spec.ts`. Assertions cover the top bar, hero greeting + CTA, forecast strip, two day cards with chips, two anticipate callouts, three quick-action rows, bottom-nav active state, day-card → itinerary navigation, and (at 1440px) the desktop detail pane with 5 timeline blocks. Plus `e2e/tests/visual/home.visual.spec.ts` for the pixel diff.

**Components added in `projects/components`:**

| Component | Key inputs (mirror as attrs) |
| --- | --- |
| `sd-icon` | `name`, `size` |
| `sd-icon-button` | `icon`, `label`, `variant` |
| `sd-button` | `variant`, `size`, `full`, `disabled` |
| `sd-chip` | `tone` |
| `sd-section` | `title`, `subtitle`, `flush` |
| `sd-tag-group` | — |
| `sd-list-item` | `title`, `subtitle`, `href`, `compact`, `flat` |
| `sd-top-bar` | `title`, `back` |
| `sd-bottom-nav` | `active` |
| `sd-hero` | `greeting`, `subtitle`, `cta` |
| `sd-weather-strip` + `sd-weather-day` | `day`, `icon`, `hi`, `lo`, `note` |
| `sd-day-card` | `day`, `date`, `weather`, `icon`, `highlight`, `href` |
| `sd-anticipate` | `icon`, `headline`, `body`, `cta` |
| `sd-split-view` | `sticky-detail`, `sticky-master` |
| `sd-timeline-block` (preview-only feature set; full set in Phase 2) | `time`, `title`, `subtitle`, `icon`, `tone`, `locked`, `drive`, `duration` |

**App in `projects/saturdaze`:**

- `home/home.page.ts/html/scss` — composes the master + detail panes with static data drawn directly from the mock.
- `app.routes.ts` adds `{ path: '', loadComponent: () => import('./home/home.page').then(m => m.HomePage) }`.

**Models in `projects/api`:**

- `WeekendOverview`, `WeatherDay`, `DaySummary`, `AnticipationTip` — TS types only for now; values are hard-coded in the page until Phase 12.

---

### Phase 2 — Itinerary detail

**Failing test (already authored):** `e2e/tests/itinerary.spec.ts` + `tests/visual/itinerary.visual.spec.ts`. Assertions cover top bar back link, eyebrow date + weather title, 4 summary chips, day-switcher master pane, weekend totals (10 blocks, 2h 5m driving, 4 locked anchors, $~120 spend), footer Regenerate + Lock day actions, full 10-block timeline on mobile, identical detail-pane timeline on desktop, `#mobile-timeline` hidden on desktop.

**Components added/extended:**

- `sd-timeline-block` — full feature set (tone variants `meal | drive | workout | fixed | downtime | indoor`, `locked` rail dot, drive chip, slotted chips, slotted actions).
- (Optionally) `sd-stat-tile` if the four totals tiles warrant a primitive.

**App:** `itinerary/itinerary.page.ts/html/scss` + route `/itinerary`.

**Models/services in `projects/api`:**

- `Block` (`time`, `duration`, `title`, `subtitle`, `icon`, `tone`, `locked`, `drive`, `chips[]`)
- `Day` (`date`, `weather`, `blocks: Block[]`)
- `WeekendPlan` (`saturday: Day`, `sunday: Day`)
- `WeekendPlanService.getDemoPlan(): Signal<WeekendPlan>` — returns the canonical mock data.

---

### Phase 3 — Activity Suggestions

**Failing test (already authored):** `e2e/tests/activities.spec.ts`. Header, filter chip strip (`All` primary, plus categories), three sections (`This weekend's weather-fit`, `If weather turns`, `Try something new`), each with `sd-activity-card`s carrying drive chip + "why" subtext + optional corner-tag.

**Components added:**

- `sd-activity-card` (`title`, `subtitle`, `drive`, `why`, `icon`, `tone`, `ages`, `tag`)

**App:** `activities/activities.page.ts/html/scss` + route + nav-active `activities`.

**Models/services:**

- `Activity` interface; `ActivityService.list(filter?: ActivityFilter)` returning `Signal<Activity[]>`.

---

### Phase 4 — Restaurant Picker

**Failing test (already authored):** `e2e/tests/restaurants.spec.ts`. Top pick La Marina with `wife-approved` chip, 4 vote rows (Quinn / Sara / Eli / Mae), two more "Other strong picks", Sunday-dinner section with Jack Astor's.

**Components added:**

- `sd-restaurant-card` (`name`, `style`, `near`, `drive`, `wifeapproved`, `icon`)
- `sd-vote-row` (`name`, `tone`, `vote: 'up' | 'down' | 'none'`)

**App:** `restaurants/restaurants.page.ts/html/scss` + route `/restaurants`.

**Models/services:**

- `Restaurant`, `FamilyVote` (`name`, `tone`, `vote`)
- `RestaurantService.picks(slot: 'lunch' | 'dinner'): Signal<Restaurant[]>`

---

### Phase 5 — Saved Weekends

**Failing test (already authored):** `e2e/tests/saved.spec.ts`. Header, filter chip strip, 3 `sd-saved-card`s in "Recent" (rating stars, favourite heart, highlights, Remix/Repeat actions), "Avoid repeating" list with Rec Room flagged "Skip".

**Components added:**

- `sd-saved-card` (`date`, `title`, `rating`, `highlights`, `favourite`)
- `sd-empty` (`title`, `subtitle`, `icon`) — used by the empty-favourites state

**App:** `saved/saved.page.ts/html/scss` + route + nav-active `saved`.

**Models/services:**

- `SavedWeekend` (`id`, `date`, `title`, `rating`, `highlights`, `favourite`, `planRef`)
- `SavedWeekendService.list(): Signal<SavedWeekend[]>`, `toggleFavourite(id: string): void`

---

### Phase 6 — Local Events Feed

**Failing test (already authored):** `e2e/tests/events.spec.ts`. Header, filter chip strip, three sections (Saturday, Sunday, Coming soon) each with `sd-event-card`s carrying a date tile + tag.

**Components added:**

- `sd-event-card` (`title`, `venue`, `when`, `drive`, `date-day`, `date-mon`, `tag`, `icon`)

**App:** `events/events.page.ts/html/scss` + route `/events`.

**Models/services:**

- `LocalEvent` (`id`, `title`, `venue`, `start`, `end`, `drive`, `tag`)
- `EventsService.listFor(weekStartingISO: string): Signal<LocalEvent[]>`

---

### Phase 7 — Shopping Errand Slot

**Failing test (already authored):** `e2e/tests/errand.spec.ts`. Form with "What's needed", "How long", best-day chip group; suggested-slot callout in a sunk `sd-card`; footer with "Pick a different slot" + "Add to weekend"; form width capped at 560–600px on tablet+.

**Components added:**

- `sd-text-input` (`label`, `value`, `placeholder`, `type`, `hint`)
- `sd-card` (`variant: default | raised | sunk`, `padding`)
- `sd-toggle` (`label`, `checked`)  *(pull forward if not already added)*

**App:** `errand/errand.page.ts/html/scss` + route `/errand`. Form state via signals (`description = signal('')` etc.) — **no `FormsModule`**.

**Models/services:**

- `Errand` (`description`, `durationMin`, `preferredDay`)
- `ErrandService.suggestSlot(errand: Errand): Signal<SuggestedSlot>`

---

### Phase 8 — Family Profile

**Failing test (already authored):** `e2e/tests/profile.spec.ts`. Centered "The Browns" header, four member rows with `sd-avatar`, three commitments rows each with "Locked" chip, daily-rhythm rows, likes/dislikes chip group, preferences card with 3 toggles (budget off, try-new on, friday-preview on), bottom-nav active `profile`, 2-column layout on desktop.

**Components added:**

- `sd-avatar` (`name`, `tone`, `size`)
- `sd-toggle` (if not landed in Phase 7)

**App:** `profile/profile.page.ts/html/scss` + route `/profile`.

**Models/services:**

- `FamilyMember`, `Commitment`, `FamilyPreferences`
- `FamilyService.profile(): Signal<FamilyProfile>` and setters for each preference

---

### Phase 9 — Dialogs & sheets

**Failing test (already authored):** `e2e/tests/dialogs.spec.ts`. The gallery page renders every dialog variant in `static` mode (block detail, regenerate, swap, restaurant vote, add commitment, add errand, Friday preview, share-with-Sara). Each variant's title + actions are asserted.

**Components added:**

- `sd-dialog` (`open`, `title`, `subtitle`, `static`) — bottom-sheet at `<720px`, centered modal at `≥720px`, inline static rendering when `[static]` is set.

**App:** `dialogs/dialogs.page.ts/html/scss` + route `/dialogs`.

In production, dialogs are opened imperatively by parent pages — e.g., tapping a timeline block opens block-detail with that block's data. Wire those at this phase too, so Itinerary's tap handler opens the dialog.

---

### Phase 10 — Component gallery

**Failing test (already authored):** `e2e/tests/components.spec.ts`. Visit `/components`, every section present, every component variant present.

**App:** `components-gallery/components-gallery.page.ts/html/scss` + route `/components`.

---

### Phase 11 — Visual baselines + pixel diff in CI

The visual specs are **already authored** at `e2e/tests/visual/*.visual.spec.ts` and the baselines are **captured in Phase 0**. This phase is the wiring rather than the spec writing:

1. Confirm `npm run baseline` (in `e2e/`) regenerates baselines deterministically — no diff after re-running.
2. Wire `npm run test:visual` into CI: it must run after `npm run test:behavior` and only against the Angular dev server.
3. On every PR, CI runs the default mode and fails on any visual regression beyond `maxDiffPixelRatio: 0.005`.
4. Document the human workflow for intentional design changes: bump the mock first → re-baseline → commit snapshots in the same PR as the Angular change.

---

### Phase 12 — Real backend integration

Deferred until the backend exists. When it does:

- Swap each `*Service` body from static data → `httpResource(() => GET …)`.
- Public signal-returning surface stays the same; consumers don't change.
- Add error states and `<sd-empty>` fallbacks per screen.
- Add an HTTP interceptor for auth, when auth lands.

---

## 5. Definition of done (per phase)

A slice ships when:

1. The named e2e spec was added/extended and went RED before any implementation.
2. Implementation is the smallest scaffold needed to take it GREEN.
3. The visual regression spec for the screen passes within tolerance.
4. `ng build` is clean for all three projects.
5. No `NgModule`s. No RxJS imports in `projects/saturdaze` or `projects/components`. No inline templates or styles. Components live in `projects/components`; models + services in `projects/api`.
6. The same POMs work against both the mock baseline (`SD_BASELINE=1`) and the Angular app. This proves selector parity.

---

## 6. Per-component checklist

For every new component:

- [ ] Folder under `projects/components/src/lib/<sd-name>/`
- [ ] Three files: `<sd-name>.ts`, `<sd-name>.html`, `<sd-name>.scss`
- [ ] `selector: 'sd-<name>'` matching the mock
- [ ] Inputs via `input()` / `input.required()` (signals)
- [ ] Each html-attribute input mirrored via `host: { '[attr.X]': 'X()' }`
- [ ] Boolean attribute presence: `host: { '[attr.X]': 'X() ? "" : null' }`
- [ ] Slots projected via `<ng-content select="[slot=X]">`
- [ ] No `OnInit`; derive with `computed()` or template expressions
- [ ] No RxJS subscribe; consume signals from services
- [ ] Exported from `projects/components/src/public-api.ts`
- [ ] Styles consume CSS custom properties (`var(--sd-bg)`), never raw hex
- [ ] Has at least one e2e assertion covering its presence and a key attribute

---

## 7. Risks & open questions

- **Angular 21 `httpResource`** is the modern signal-friendly HTTP fetch. Confirm whether to use it directly inside services or to wrap (the latter keeps services swappable for in-memory mocks more cleanly). Recommendation: wrap, with `provideMockData()` vs `provideHttpData()` providers selected in `app.config.ts`.
- **Host-attribute mirroring is easy to forget.** Add a tiny `host-attr-mirror.spec.ts` per component (or a single shared spec that iterates the catalogue) that creates the component and asserts each declared input is present on the host element. Cheaper than discovering it via an e2e failure two phases later.
- **Slot semantics.** `<slot name="chips">` (web components) and `<ng-content select="[slot=chips]">` (Angular) both project on attribute presence — confirmed compatible, but worth a single explicit test in Phase 0 to lock it in.
- **Font stability.** The mocks use the system font stack. For pixel-stable visual diffs across CI runs (Linux vs macOS), self-host Inter from a single `.woff2` in `projects/saturdaze/public/` and link it from both the mock `index.html` and the Angular `index.html`. Otherwise expect ~0.4% per-character diff and bump `maxDiffPixelRatio` accordingly.
- **`sd-bottom-nav` href targets.** In the mocks the rail navigates via raw `home.html` hrefs because there's no router. The Angular implementation must use `routerLink` to clean Angular routes (`/`, `/activities`, …) while still emitting `href` attributes that end in `home.html` etc. **only when running in baseline mode.** Easiest fix: have the component accept a `routes` input map; the app supplies Angular routes; tests assert via `data-active` rather than `href$=`. Adjust the POM accordingly in Phase 0.

---

## 8. Suggested first commit

Phase 0 only:

1. `cd e2e && npm install && npm run baseline` — capture mock screenshots. Commit `tests/visual/*-snapshots/`.
2. Delete placeholder content: Angular starter `app.html`, `lib-api`, `lib-components` placeholders.
3. Replace `app.html` with `<div class="sd-frame"><router-outlet/><sd-bottom-nav active="home"/></div>`.
4. Port `docs/mocks/styles/tokens.css` → SCSS partials in `frontend/projects/components/src/lib/styles/`.
5. Wire `frontend/projects/saturdaze/src/styles.scss` to `@use 'components/styles'` (mapping added in `angular.json` `stylePreprocessorOptions.includePaths`).
6. Implement `sd-bottom-nav` (most-shared component, smallest possible feature set) so `e2e/tests/navigation.spec.ts` goes GREEN.

Stop. Open the PR. Phase 1 (Home) is the next commit.
