# Angular component attribute cleanup plan

Decouple Angular components in `frontend/projects/components` from the
web-component-style host-attribute pattern that was used to keep parity
with the original `docs/mocks/components/*.js` custom elements.

---

## 1. Context

### 1.1 How we got here

The mocks under `docs/mocks/components/` are native Custom Elements. In the
Custom Element world, the only way state surfaces from JS into CSS is via
host attributes — there is no scoped stylesheet that can read JS class
fields. Selectors like `:host([variant="ghost"])` are the idiomatic way to
style state.

When the components were ported to Angular, the convention in
`docs/frontend-implementation-plan.md` §2.2 was to mirror every input to a
host attribute so that:

- The same SCSS (with `:host([attr])` selectors) could be carried over from
  the mocks essentially unchanged.
- The Playwright POMs (`e2e/pages/*.page.ts`) and specs could keep using
  the same attribute-based locators (`sd-button[variant="primary"]`,
  `sd-list-item[title="…"]`, etc.) against either the mock baseline or the
  Angular app.

That parity-with-the-mocks goal has been met. The mocks are no longer the
target — Angular is — and the cost of the pattern is now visible:

- 25 of 27 components carry a `host: { '[attr.x]': '…' }` block.
- ~10 of those mirror attributes that nothing in CSS reads — they exist
  purely as e2e anchors.
- Defaults are suppressed via the `value === default ? null : value`
  ternary, which is repeated 11 times across the library.
- Boolean attributes use the `'foo() ? "" : null'` idiom, repeated 9 times.
- Several components alias inputs purely to dodge HTML/Angular naming
  collisions (`sectionTitle` → `title`, `blockTitle` → `title`,
  `dialogTitle` → `title`, `staticMode` → `static`, `titleAttr` → `title`,
  `emptyTitle` → `title`, `cardTitle` → `title`, `rowTitle` → `title`,
  `whenLabel` → `when`), which adds friction for no current benefit.
- The pattern conflicts with Angular idioms: scoped styles can read
  component fields directly via `[class.x]` or `host: { '[class.x]':
  '…' }`, and unit tests can introspect the component instance instead of
  the DOM.

### 1.2 What "tech debt" means here

There are **two distinct piles** of debt, and they have different fixes:

1. **Styling debt** — `:host([attr])` selectors in SCSS that exist only
   because the host attribute is the only handle CSS has on component
   state. Fixable by switching to `:host(.x)` selectors backed by host
   class bindings.
2. **Mirroring debt** — `[attr.x]` host bindings for attributes that no CSS
   reads. Either e2e anchors (keep, but justify) or dead code (remove).

Conflating the two leads to either over- or under-refactoring. The plan
below separates them.

---

## 2. Inventory (current state, May 2026)

Audit of `frontend/projects/components/src/lib/`:

| Component | Host attrs | SCSS `:host([…])` | Boolean inputs | Aliased inputs |
|---|---|---|---|---|
| `button` | variant, size, full, disabled | 8 | full, disabled | — |
| `icon-button` | icon, label, variant | 2 | — | — |
| `chip` | tone | 7 | — | — |
| `card` | variant, padding, interactive | 6 | interactive | — |
| `avatar` | name, tone, size | 8 | — | — |
| `toggle` | label, checked | 1 | checked | — |
| `text-input` | label, value, placeholder, type, hint | 0 | — | — |
| `icon` | name, size | 1 (`filled`) | — | — |
| `dialog` | static, title, subtitle | 2 | staticMode | staticMode→static, dialogTitle→title |
| `section` | title, subtitle, flush | 1 | flush | sectionTitle→title |
| `top-bar` | title, back | 0 | back (custom) | titleAttr→title |
| `bottom-nav` | active | 0 | — | — |
| `split-view` | sticky-detail, sticky-master | 2 | both | stickyDetail→sticky-detail, stickyMaster→sticky-master |
| `hero` | greeting, subtitle, cta | 0 | — | — |
| `empty` | title, subtitle, icon | 0 | — | emptyTitle→title |
| `anticipate` | icon, headline, body, cta | 0 | — | — |
| `list-item` | title, subtitle, href, compact, flat | 2 | compact, flat | rowTitle→title |
| `activity-card` | title, subtitle, drive, why, icon, tone, ages, tag | 3 | — | cardTitle→title |
| `day-card` | day, date, weather, icon, highlight, href | 0 | — | — |
| `event-card` | title, venue, when, drive, date-day, date-mon, tag, icon | 0 | — | cardTitle→title, whenLabel→when, dateDay→date-day, dateMon→date-mon |
| `saved-card` | date, title, rating, highlights, favourite | 0 | favourite | cardTitle→title |
| `restaurant-card` | name, near, drive, wifeapproved, icon | 0 | wifeapproved | — |
| `vote-row` | name, tone, vote | 0 | — | — |
| `weather-day` | day, icon, hi, lo, note | 2 | — | — |
| `weather-strip` | — | 0 | — | — |
| `tag-group` | — | 0 | — | — |
| `timeline-block` | time, title, subtitle, icon, tone, locked, drive, duration | 7 | locked | blockTitle→title |

Totals:
- **27** components, **25** with a `host: {}` block.
- **11** components have at least one styled host attribute (Bucket A).
- **12** components mirror attributes that no CSS reads (Bucket B).
- **2** components are already clean (`tag-group`, `weather-strip`).
- **9** aliases exist purely to keep an attribute named `title`/`static`/`when`/etc. on the host while avoiding TS or Angular collisions.

### 2.1 External dependencies on these attributes

- `e2e/` — **~70 locator usages** across 14 files use attribute selectors:
  `sd-list-item[title="…"]`, `sd-chip[tone="warn"]`,
  `sd-icon-button[icon="more"]`, `sd-text-input[label="Name"]`,
  `sd-timeline-block[locked]`, `sd-saved-card[favourite]`,
  `sd-vote-row[name="Mae"]`, etc. (see `e2e/pages/*.page.ts` and
  `e2e/tests/{saved,dialogs,profile,itinerary}.spec.ts`).
- `frontend/projects/saturdaze/src/` — consumers use **input bindings**
  (`<sd-chip [tone]="t.tone">`), not attribute selectors. Consumers are
  unaffected by host-attribute changes.
- `frontend/projects/components/src/lib/styles/` — global SCSS has **zero**
  `:host(…)` selectors. Nothing else reads these attributes.

The hard external coupling is the e2e suite. Visual baselines under
`e2e/tests/visual/*.spec.ts-snapshots/` are the second coupling: any
rendering change has to survive a visual diff.

---

## 3. Target end state

Per component:

1. **No `'[attr.x]': '…default-suppression ternary…'` boilerplate.** State
   that drives styling lives in **host class bindings**, not host
   attribute bindings.
2. **No `:host([attr="value"])` selectors in SCSS.** Replaced by
   `:host(.x)` selectors backed by `host: { '[class.x]': 'expr' }` (or the
   equivalent `@HostBinding`).
3. **Attribute mirroring kept only when an e2e locator depends on it**,
   and only for the attributes that actually appear in `e2e/`. Mirroring
   becomes the exception, not the default, and each surviving one is
   justified by a comment that names the test (e.g.
   `// e2e: sd-list-item[title="…"]`).
4. **Aliases dropped** for the components whose `title` /
   `static` / `when` / `date-day` / `date-mon` / `sticky-*` attributes are
   no longer needed on the host. The TS input keeps its natural name
   (`title`, `static`, etc.); aliases only remain where (a) the attribute
   is still e2e-locator-needed AND (b) the natural name collides with TS
   reserved words or Angular's own bindings.
5. **Input names continue to match what the consumer writes in the
   template** (`<sd-button variant="primary">`). Removing the host mirror
   does NOT change how consumers bind inputs — Angular accepts the
   attribute syntax for string inputs regardless.

### 3.1 Concrete example — `button`

Before:

```ts
host: {
  '[attr.variant]':  'variant() === "primary" ? null : variant()',
  '[attr.size]':     'size() === "md" ? null : size()',
  '[attr.full]':     'full() ? "" : null',
  '[attr.disabled]': 'disabled() ? "" : null',
}
```

```scss
:host([full]) { display: block; }
:host([variant="secondary"]) button { … }
:host([disabled]) button { … }
```

After:

```ts
host: {
  '[class]': 'hostClasses()',
}

// in the class:
readonly hostClasses = computed(() =>
  `variant-${this.variant()} size-${this.size()}` +
  (this.full() ? ' is-full' : '') +
  (this.disabled() ? ' is-disabled' : '')
);
```

```scss
:host(.is-full) { display: block; }
:host(.variant-secondary) button { … }
:host(.is-disabled) button { … }
```

(Alternative idiom: discrete `'[class.variant-secondary]'` entries in
`host`. Either works; `computed()` keeps the host block one line and
co-locates the naming.)

### 3.2 Concrete example — `event-card`

Before:

```ts
host: {
  '[attr.title]':    'cardTitle() || null',
  '[attr.venue]':    'venue() || null',
  '[attr.when]':     'whenLabel() || null',
  '[attr.drive]':    'drive() || null',
  '[attr.date-day]': 'dateDay()',
  '[attr.date-mon]': 'dateMon()',
  '[attr.tag]':      'tag() || null',
  '[attr.icon]':     'icon() || null',
}

readonly cardTitle = input('', { alias: 'title' });
readonly whenLabel = input('', { alias: 'when' });
readonly dateDay   = input('17', { alias: 'date-day' });
readonly dateMon   = input('MAY', { alias: 'date-mon' });
```

After (`event-card` is referenced by `e2e/pages/events.page.ts` as
`sd-event-card[title="…"]` — only `title` needs to stay on the host):

```ts
host: {
  '[attr.title]': 'title() || null',  // e2e: sd-event-card[title="…"]
}

readonly title    = input('');
readonly venue    = input('');
readonly when     = input('');
readonly drive    = input('');
readonly dateDay  = input('17');   // alias dropped, no longer on host
readonly dateMon  = input('MAY');
readonly tag      = input('');
readonly icon     = input('');
```

Net: 8 host attrs → 1, 4 aliases → 0, one comment explaining the survivor.

---

## 4. Migration strategy

### 4.1 Three buckets, three playbooks

**Bucket A — components with `:host([attr])` styling selectors**
`button`, `icon-button`, `chip`, `card`, `avatar`, `toggle`, `split-view`,
`list-item`, `activity-card`, `timeline-block`, `weather-day`, `dialog`,
`section`, `icon` (the `[filled]` selector).

Per component:

1. For each `:host([x])` selector, decide the equivalent class name.
   Convention:
   - Variant enums → `variant-<value>` (e.g. `variant-secondary`).
   - Size enums → `size-<value>` (`size-sm`, `size-lg`). Suppress the
     default the same way the attribute did (don't emit `size-md`).
   - Tone enums → `tone-<value>`.
   - Booleans → `is-<name>` (`is-full`, `is-disabled`, `is-interactive`,
     `is-locked`, `is-checked`, `is-favourite`, `is-flat`, `is-compact`,
     `is-flush`, `is-static`, `is-sticky-detail`, `is-sticky-master`).
   - `icon-button` variant — same `variant-<value>` rule.
2. Add the class bindings to `host: { … }` (or `@HostBinding`). Choose one
   style across the library and keep it consistent.
3. Replace SCSS selectors `:host([x])` / `:host([x="y"])` /
   `:host(:not([x]))` with `:host(.is-x)` / `:host(.x-y)` /
   `:host(:not(.is-x))`.
4. Drop the corresponding `[attr.x]` entry from `host`, **unless** the
   attribute also appears in an e2e locator (see §4.3).
5. Re-run the per-screen Playwright behavior spec for any screen that
   uses this component, plus the visual spec. Visual diffs in the noise
   range (< the configured `maxDiffPixelRatio`) are fine; anything larger
   is a regression to investigate before committing.

**Bucket B — components that mirror attributes nothing in CSS reads**
`text-input`, `top-bar`, `bottom-nav`, `hero`, `empty`, `anticipate`,
`day-card`, `event-card`, `saved-card`, `restaurant-card`, `vote-row`.

Per component:

1. List the attributes this component currently mirrors.
2. Cross-reference against `rg "sd-<name>\[" e2e/`. Any attribute that
   does NOT appear in a locator → delete the `[attr.x]` line and the
   alias (if any).
3. Any attribute that DOES appear → keep the `[attr.x]` line, add a
   one-line `// e2e: …` comment naming the spec/POM, and drop any alias
   that's no longer doing real work.
4. Re-run the screen's behavior spec to confirm the locator still binds.

**Bucket C — already clean**
`tag-group`, `weather-strip`. Skip.

### 4.2 What the e2e suite actually needs

A quick scan of `e2e/` (run `rg "sd-[a-z-]+\[" e2e/`) identifies the
attributes the suite locks in. Roughly:

- `sd-list-item[title=…]`
- `sd-chip[tone=…]`
- `sd-icon-button[icon=…]`
- `sd-text-input[label=…]`, `sd-text-input[label=…][value=…]`
- `sd-timeline-block[locked]`
- `sd-saved-card[title=…]`, `sd-saved-card[favourite]`
- `sd-vote-row[name=…]`, plus `toHaveAttribute('vote', …)`
- `sd-section[title=…]`
- `sd-event-card[title=…]`
- `sd-button[variant=…]` (a few)

Anything not on that list can stop being mirrored. The exact final list
should be derived mechanically from a single `rg` pass at the start of the
work, not from this document — locators change.

### 4.3 Should e2e migrate off attribute locators?

Open question. Two options:

- **(a) Keep attribute locators, keep the survivors mirrored.** Lowest
  risk, no test churn. Each mirrored attribute carries a justifying
  comment. This is the default in the plan above.
- **(b) Migrate e2e to `data-testid` and stop mirroring entirely.** Cleaner
  end state — components have zero attribute-mirroring debt — but touches
  every POM and spec, and the new test ids have to be added to component
  templates. Higher churn, higher reward.

Recommend (a) for this pass. Revisit (b) as a separate plan once the
styling debt is gone — the two changes don't have to ship together.

### 4.4 Update the convention doc

`docs/frontend-implementation-plan.md` §2.2 currently mandates
"mirror every input to a host attribute." That convention needs to be
rewritten to match the new direction:

- New components should bind state to host **classes**, not attributes.
- Mirror an attribute only when an e2e locator depends on it, and comment
  the dependency.
- Aliases only for genuine naming collisions.

Without this update, the next component added to the library will
reintroduce the same debt.

---

## 5. Phasing

Each phase ships independently, on its own commit, behind a green
behavior + visual run for the screens it touches. The order is chosen so
that the highest-leverage / lowest-risk components go first and the
e2e-coupled ones go later when the playbook is proven.

**Phase 1 — Convention update (no code).**
Rewrite `docs/frontend-implementation-plan.md` §2.2. Land it before any
component changes so reviewers have the new rule to lean on.

**Phase 2 — Bucket B, easy wins (no styling churn, no e2e churn).**
Components in Bucket B whose attributes are NOT referenced in any e2e
locator at all. Likely candidates from the inventory: `hero`, `anticipate`,
`day-card`, `bottom-nav`, `top-bar`, `restaurant-card`, `vote-row`
(check `vote` attribute — `dialogs.spec.ts` uses `toHaveAttribute('vote',
…)`, so keep that one).

Per component: delete the host block, delete aliases. Run the screen's
behavior + visual spec. One commit per component or per small group.

**Phase 3 — Bucket B, partial mirroring (keep e2e survivors).**
`text-input`, `empty`, `saved-card`, `event-card`. Trim the host block to
just the attributes the e2e suite locates by. Drop the dead aliases.

**Phase 4 — Bucket A, smallest first.**
`toggle` (1 SCSS selector), `icon` (1 selector), `weather-day` (2),
`split-view` (2), `section` (1), `dialog` (2). These are low-surface
proofs of the class-binding swap. Land each individually so the visual
diff is easy to read.

**Phase 5 — Bucket A, medium.**
`icon-button`, `list-item`, `activity-card`, `card`. More selectors,
still scoped.

**Phase 6 — Bucket A, largest.**
`chip` (7), `avatar` (8), `button` (8), `timeline-block` (7). Highest
visual surface, most-consumed components. Save for last so all earlier
phases' lessons apply.

**Phase 7 — Verify and tidy.**
- Full Playwright run (behavior + visual, all viewports).
- `rg "\[attr\." frontend/projects/components/` — every remaining match
  should be accompanied by an `// e2e:` comment.
- `rg "alias:" frontend/projects/components/` — every remaining alias
  should be on an attribute that's still on the host.
- Update the audit table in this doc to "done".

---

## 6. Verification per slice

For each component touched:

1. **Type-check + build.** `cd frontend && ng build components`. The
   components library has to compile cleanly before consumers will.
2. **Behavior specs.** From `e2e/`, run the spec(s) for any screen the
   component appears on. Locators must still find the element.
3. **Visual specs.** Same screens. Visual diffs at or below the
   configured tolerance are fine; if the diff is larger, investigate
   before committing. Don't re-baseline silently.
4. **Manual spot check.** Open the components gallery
   (`projects/saturdaze/src/app/pages/components-gallery/`) for the
   component and confirm all variants render. Several components only
   render every variant in the gallery, not on a real page.

Don't move to the next component until the current one is green.

---

## 7. Risks and how the plan handles them

- **Visual regression from a typo in a class name.** Most likely failure
  mode. The phasing puts small components first so the diff stays
  legible, and every commit re-runs the visual spec. A correctly-renamed
  class is undetectable; a missing one will jump out of the diff.
- **E2e locator silently breaks.** Guarded by running the behavior spec
  on every slice. The `// e2e:` comment also makes the dependency
  visible at the source of the truth so future edits don't strip it.
- **Consumer template breaks.** Inputs aren't renamed, so consumers don't
  change. The risk is limited to components where we drop an alias
  (`sectionTitle`, `blockTitle`, etc.) — that DOES rename the TS input,
  and any internal binding (`#section.sectionTitle()`) needs updating.
  `rg "\.<oldAlias>\(\)" frontend/projects/` per component before
  removing.
- **`docs/frontend-implementation-plan.md` falls out of date.** Phase 1
  exists specifically to prevent this; the convention update lands first.
- **Future components reintroduce the pattern.** Mitigated by the
  convention update + by reviewers using the new doc as the standard.
  Optionally: add a lint rule that forbids `[attr.` in the `host:` block
  unless the line has an `// e2e:` comment. Not in scope for this plan.
- **Re-baselining masks a real regression.** The plan deliberately does
  NOT re-baseline visuals. If the diff is real, fix the code, not the
  snapshot.

---

## 8. Out of scope

These are real cleanups but not part of this plan:

- Migrating e2e off attribute locators onto `data-testid` (see §4.3
  option (b)).
- Replacing `:host {}` SCSS with `:host-context` or `@HostBinding('class')`
  decorator style — the `host: { '[class.x]': … }` form is fine.
- Converting components to use Angular's `inject()` style or other
  unrelated modernization. One axis of change at a time.
- Removing the `sd-` selector prefix or renaming components (see bug 011
  — that's a separate ongoing discussion).
- Touching the components in `docs/mocks/` — they stay as the original
  reference, unchanged.

---

## 9. Definition of done

- Every component in `frontend/projects/components/src/lib/` either has no
  `host: {}` block, or its `host: {}` block contains only:
  - `[class…]` bindings (driving styling), and/or
  - `[attr.x]` bindings each accompanied by a `// e2e: …` comment.
- Zero `:host([…])` selectors in any component SCSS — all replaced by
  `:host(.…)`.
- Aliases (`alias: '…'` in `input()`) appear only where the input name
  genuinely cannot be the same as the attribute name.
- `docs/frontend-implementation-plan.md` §2.2 reflects the new
  convention.
- Full Playwright run is green (behavior + visual, all three viewports).
- `ng build components && ng build saturdaze` clean.
