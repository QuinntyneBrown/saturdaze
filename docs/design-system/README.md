# Saturdaze design system

Extracted from [docs/mocks](../mocks/README.md) on 2026-10-08. Open [index.html](index.html) locally
(it works from `file://`; press `t` to switch themes).

This is a static **reference**, not a second component library. The Angular `components` library and its
Storybook remain the product's live documentation ([ADR-012](../adr/ADR-012-storybook-design-system.md)).
Token names follow the product's Fluent UI v9 model ([ADR-013](../adr/ADR-013-fluent-design-tokens.md)), and
component classes are the mocks' BEM classes, the parity contract with the app and the e2e suite
([ADR-009](../adr/ADR-009-v2-responsive-shell.md)). `docs/mocks` was not modified: where the system and the mocks
differ, the difference is in the drift log below for the product to adopt deliberately.

## Foundations

| Page | Covers |
|---|---|
| [Color](foundations/color.html) | Ten ramps, alias roles, both themes, every contrast pair with live ratios, adding a brand theme. |
| [Typography](foundations/typography.html) | Inter, nine sizes, weights, line heights, letter spacing, thirteen roles, measure, responsive retunes. |
| [Spacing](foundations/spacing.html) | 4px scale with Fluent's 2/6/10px nudges, inside vs between, padding by component size, control heights. |
| [Layout](foundations/layout.html) | Breakpoints (380/576/720/1024), columns, gutters, containers, page templates. |
| [Elevation](foundations/elevation.html) | Four shadows plus focus, surface hierarchy, dark elevation, z-order. |
| [Shape](foundations/shape.html) | Radii, stroke widths, which radius for which size. |
| [Motion](foundations/motion.html) | Durations, curves, replayable demos, reduced motion. |
| [Iconography](foundations/iconography.html) | The 50-icon sprite, sizes, labelling, one meaning per icon. |
| [Theming](foundations/theming.html) | Light, dark and OS preference, the three tiers, tokens.json, relation to the product theme. |
| [Responsive](foundations/responsive.html) | Mobile-first rules, per-component behaviour, touch, safe areas, test matrix. |
| [Accessibility](foundations/accessibility.html) | WCAG 2.2 AA commitments, targets, focus, testing, component contract. |
| [Content](foundations/content.html) | Voice, casing, numbers and times, error, empty and confirmation formulas, microcopy library. |

## Components

| Component | Group | Variants | States | Source mocks |
|---|---|---|---|---|
| [Button](components/button.html) | Actions | primary, quiet, ghost, text, warn text, danger; icon, icon-only, block; sm/md/lg | hover, focus, active, disabled, loading, pressed, expanded | all pages; dialogs |
| [Link](components/link.html) | Actions | inline, soft, with icon, Directions, external | hover, focus, visited | auth pages, weekend, review |
| [Menu](components/menu.html) | Actions | with icons, header, warn item, checkable, separator | hover, focus, disabled, checked, open | dialogs D25, D26 |
| [Form field](components/form-field.html) | Inputs | label, required/optional, hint, error, success, counter, row, with button | invalid, read-only | auth, dialogs |
| [Text field](components/text-field.html) | Inputs | text, email, password + show, number, search, time, copy field, strength | hover, focus, invalid, read-only, disabled | sign-in, create-account, dialogs, admin |
| [Textarea](components/textarea.html) | Inputs | with counter | focus, invalid, read-only, disabled | dialogs D10, D24, AD3 |
| [Select](components/select.html) | Inputs | native, placeholder option | focus, invalid, disabled | admin.places, admin.activity, dialogs |
| [Checkbox](components/checkbox.html) | Inputs | single, with description, group | checked, indeterminate, invalid, disabled | sign-in, create-account, family |
| [Radio group](components/radio-group.html) | Inputs | vertical, row, segmented (seg-radio 2/3) | checked, focus, invalid, disabled | dialogs D7, D17 |
| [Switch](components/switch.html) | Inputs | label right, label left, with description | on, off, focus, disabled | sign-in, family |
| [Chip input](components/chip-input.html) | Inputs | removable chips + entry field | focus, empty, full | dialogs D20 |
| [File upload](components/file-upload.html) | Inputs | drop zone, avatar picker | dragging, uploading, failed | dialogs D27, AD1 |
| [Photo pick](components/photo-pick.html) | Inputs | photo grid, upload tile | selected, focus, hover | dialogs D29, AD5 |
| [Rating](components/rating.html) | Inputs | display, input | checked, focus, hover | past, dialogs D13 |
| [Vote row](components/vote-row.html) | Inputs | up/down per member | pressed, hover, focus, disabled | ideas, past |
| [Form layout](components/form-layout.html) | Inputs | single column, pairs, dialog form, actions, error summary | submitting, invalid | auth pages, dialogs |
| [Top bar](components/top-bar.html) | Navigation | app top bar, public site bar | scrolled, current | _shell, weekend, landing |
| [Bottom nav](components/bottom-nav.html) | Navigation | four destinations | current, hover, focus | _shell and app pages |
| [Sidebar navigation](components/sidebar-navigation.html) | Navigation | admin bar, admin sidebar, counts | current, hover, focus | admin pages |
| [Tabs (segments)](components/tabs.html) | Navigation | tablist, page switch, narrow, counts | selected, current, hover, focus, disabled | weekend, ideas, legal |
| [Breadcrumb](components/breadcrumb.html) | Navigation | trail, collapsed back link | current, hover, focus | admin.place (back link) |
| [Pagination](components/pagination.html) | Navigation | previous/next with count, toolbar | disabled ends, focus | admin.places, admin.activity |
| [Skip link](components/skip-link.html) | Navigation | one | focused | none (D22) |
| [Footer](components/footer.html) | Navigation | site footer, auth footer | link hover, focus | landing, legal, auth pages |
| [Card](components/card.html) | Containers and overlays | default, pad-lg, sunk, locked, selected, dimmed, muted, media, interactive | hover, focus within, selected, locked | ideas, past, family, review, admin |
| [Dialog](components/dialog.html) | Containers and overlays | default, confirm, destructive, form, success, wide, sheet | busy, invalid | dialogs D1 to D29, AD1 to AD6 |
| [Tooltip](components/tooltip.html) | Containers and overlays | above, below, with shortcut | visible | none (product sd-tooltip) |
| [Divider](components/divider.html) | Containers and overlays | horizontal, vertical, labelled | none | filters |
| [Container and grid](components/container.html) | Containers and overlays | container, stack, cluster, grids, scroller | none | all pages |
| [Page header](components/page-header.html) | Containers and overlays | title, back link, subtitle, actions, more; section header | none | weekend, ideas, family, admin |
| [List](components/list.html) | Data display | plain, card list, action rows, place rows | hover, focus, selected | family, review, admin, dialogs |
| [Description list](components/description-list.html) | Data display | label beside value, stacked, links, faint | none | review, admin.place, dialogs |
| [Table](components/table.html) | Data display | default, dense, sortable, selectable | row hover, selected, sorted, loading, empty | admin.activity (D23) |
| [Activity feed](components/activity-feed.html) | Data display | stacked rows, five columns from 1024 | none | admin.activity |
| [Avatar](components/avatar.html) | Data display | initials in four tones, photo, button, group; sm/md/default/lg/xl | hover (button), focus | family, top bar, dialogs D27 |
| [Badge](components/badge.html) | Data display | count, status tones, tag | none | admin nav, review, filters |
| [Chip](components/chip.html) | Data display | ten tones, small, with icon, removable, email chip | remove hover, focus | weekend, ideas |
| [Filter chip](components/filter-chip.html) | Data display | neutral and six tints, link form | pressed, current, hover, focus, disabled | ideas, past, admin.places |
| [Disc](components/disc.html) | Data display | icon disc in four sizes and eight tones, weather disc, date tile | none | weekend, review, empty states |
| [Media](components/media.html) | Data display | 16:9, 4:3, credit, fallback tiles | loading | ideas, past, admin |
| [Cover photo](components/cover.html) | Data display | photo, title block, change photo, credit | hover, focus (edit) | weekend, past, dialogs D29 |
| [Stat](components/stat.html) | Data display | figure, bar, delta, link list | loading | admin |
| [Itinerary](components/itinerary.html) | Data display | day header, blocks (commitment, locked, errand, drive, done, active), legs, add row | hover, focus within, active | weekend, weekend.empty |
| [Map](components/map.html) | Data display | route sketch, pins, legend, planner | active pin | weekend (D18) |
| [Toast](components/toast.html) | Feedback | info, success, caution, warn; with action; stacked | leaving | none (core) |
| [Alert](components/alert.html) | Feedback | banner in four tones, page banner, wells | dismissible | sign-in, review, dialogs, verify-email |
| [Inline message](components/inline-message.html) | Feedback | hint, error, success | none | auth pages, dialogs |
| [Progress bar](components/progress-bar.html) | Feedback | determinate, brand, danger, indeterminate, strength | none | admin stat bars, create-account |
| [Spinner](components/spinner.html) | Feedback | sm/md/default, spinner disc, status row, inline | none | weekend.generating, verify-email |
| [Skeleton](components/skeleton.html) | Feedback | text, title, disc, rect, time, timeline row | none | weekend.generating |
| [Empty state](components/empty-state.html) | Feedback | default, warm first run, compact | none | weekend.empty, past.empty, review-submissions.empty |
| [Error page](components/error-page.html) | Feedback | 404, 403, 500 with reference, offline | none | none (core) |
| [Auth card](components/auth-card.html) | Auth and marketing | sign in, create account, reset (5 states), verify (3 states), admin sign in | error, sent, expired | auth pages, admin.sign-in |
| [Hero](components/hero.html) | Auth and marketing | hero with browser frame, steps | none | landing |

## Patterns

| Pattern | Covers |
|---|---|
| [Forms](patterns/forms.html) | Layout, labels, validation timing, error summary, submit states, no inline forms. |
| [Feedback and loading](patterns/feedback-and-loading.html) | Inline vs toast vs banner vs dialog; skeleton vs spinner vs progress; Undo. |
| [Empty and error states](patterns/empty-and-error-states.html) | Copy formulas, first run vs no results vs error. |
| [Navigation and page structure](patterns/navigation.html) | App and admin shells, page header, back link vs breadcrumb, tabs vs page switch. |
| [Dialogs and overlays](patterns/dialogs-and-overlays.html) | Dialog vs sheet vs menu vs tooltip; stacking; focus management. |
| [Tables and lists](patterns/data-tables-and-lists.html) | Rows vs cards vs table, filtering, sorting, paging, responsive strategy. |
| [Notifications](patterns/notifications.html) | Toast vs banner vs well; priority; auto-dismiss rules; live regions. |
| [Content and tone](patterns/content-and-tone.html) | Voice and formulas applied in composed UI. |

## Tokens

- [`tokens/tokens.css`](tokens/tokens.css): the source of truth. Global ramps (`--globalColor*`), alias tokens
  (`--color*`, `--fontSize*`, `--spacing*`, `--borderRadius*`, `--shadow*`, `--duration*`, `--curve*`, `--zIndex*`,
  `--layout*`, `--typography*`, `--target*`, `--controlHeight*`), a light theme on `:root` and `[data-theme="light"]`,
  a dark theme on `[data-theme="dark"]` and under `prefers-color-scheme: dark` (the two dark blocks must stay
  identical), plus reduced-motion, more-contrast and forced-colors overrides.
- [`tokens/tokens.json`](tokens/tokens.json): DTCG export. Regenerate with
  `python docs/design-system/tokens/export_tokens.py`; [`export_tokens.py`](tokens/export_tokens.py) nests the
  camelCase names (`--colorBrandBackgroundHover` → `color.brand.backgroundHover`) and puts dark values under
  `$extensions["com.saturdaze"].themes.dark`.
- [`tokens/contrast-pairs.json`](tokens/contrast-pairs.json): every foreground/background pairing the components
  rely on, checked in both themes.
- [`assets/components.css`](assets/components.css): the component CSS, token-only, with `--sd-*` component tokens
  and `data-state="hover|focus|active"` hooks for the documentation. [`assets/icons.js`](assets/icons.js) injects
  the icon sprite. [`assets/ds.css`](assets/ds.css) and [`assets/ds.js`](assets/ds.js) are documentation chrome only.

Where a token exists in the product's generated `_tokens.scss`, it has the same name here. Values differ only
where the drift log says so (mostly AA contrast fixes); new tokens (`--fontSizeBase350`, `--colorStatusInfo*`,
`--colorStatusWarning*`, the dark theme, `--layoutBreakpoint*`, `--target*`, `--controlHeight*`, `--zIndexDialog`
and up) are proposals for the product's TypeScript theme.

## Drift found in the mocks

| ID | Mock | Issue | Resolution |
|---|---|---|---|
| D03 | every page, focus | Focus ring `2px solid --sd-primary` is 2.81:1 on the cream canvas (1.4.11, 2.4.7). | `--colorStrokeFocus2` #A04B2C (5.56:1 on canvas, 5.18:1 on wells). |
| D04 | fields, timeline, footers | `--sd-ink-faint` #9CA3AF used for text (placeholders, `field__req`, `block__dur`, `empty__note`, `auth__foot`, `site-footer`, `hero__note`, `list__trail`) is 2.38 to 2.54:1. | `--colorNeutralForeground3` #636A77 (4.75:1 on wells). #9CA3AF is kept for disabled text only. |
| D05 | chips, wells, segments | `--sd-ink-soft` #6B7280 on `--sd-surface-2` is 4.22:1. | `--colorNeutralForeground2` #5B6270 (5.35:1 on wells, 6.13:1 on white). |
| D06 | fields, switch, quiet button | Input borders and the off switch track use `--sd-line-strong` (16% ink), 1.36:1 (1.4.11). | `--colorNeutralStrokeAccessible` #80868F (3.67:1 on white, 3.20:1 on wells). |
| D07 | `chip--accent`, `chip--leaf`, approved row | Forest #2D7D5F text on its own tint is 4.11 to 4.12:1. | `--colorStatusSuccessForeground1` / `--colorPaletteLeafForeground1` #256B51 (5.25:1). #2D7D5F stays as the solid fill. |
| D08 | dialogs D21, D24, AD5 | `.btn--danger` white on `--sd-warn` #C45A3F is 4.30:1, and too close to the new brand fill. | `--colorStatusDangerBackground3` #AE2B2B (6.60:1), a brick red that reads differently from the brand coral in both themes. |
| D09 | `dialogs.html` D13, `past.html` | Rating stars: filled #F4C969 is 1.57:1, empty #9CA3AF is 2.54:1 on white; D13 is an input. | Filled `--colorPaletteSunForeground3` #B07F14 (3.56:1), empty `--colorNeutralStrokeAccessible`; filled vs outline shape also differs. |
| D10 | `bottom-nav` | Current tab icon coral #E07856 on coral tint is 2.6:1. | `--colorBrandForeground1` #A04B2C (4.97:1). |
| D11 | `media__credit`, `photo-pick__name` | 11px white text on a 55 to 60% ink pill over unknown photos. | `--colorBackgroundOverlayStrong` (72%) and 12px. |
| D12 | many | Text below 12px: 10px date-tile month; 11px bottom-nav labels, `chip--sm`, media credit, photo labels, browser-frame URL, admin tag, small avatar. | Minimum 12px (`--fontSizeBase200`). |
| D13 | `app.css` | A raw 14px is used 23 times outside the type scale (buttons, nav links, menu items, switch labels). | New step `--fontSizeBase350` (14px). |
| D14 | landing, date tile, step, page header | Off-scale type: 18px (hero lede, step title, date-tile day), 28px (`how__title`), weight 800 (hero title); line heights 1.05, 1.15, 1.25, 1.3, 1.45, 1.6. | 17px, 26px, weight 700; line heights snapped to None 1 / Tight 1.2 / Snug 1.35 / Normal 1.5 / Relaxed 1.65. |
| D15 | wells, banners, dialogs, auth | Off-grid spacing: 14px (well and banner padding, dialog and auth-form gaps), 18px (auth-card gap), 22px (large button padding), 28px (auth-card padding), 7px, 3px, 15px. | Snapped to the 4px scale (12/16/24/32). Fluent's 2, 6 and 10px nudges are kept as tokens. |
| D16 | `landing.html` | Hero padding 72px at desktop is off the spacing scale. | `--layoutSpacePage` (64px). |
| D17 | `app.css` | Literal colours: `#fff` on danger, ink chip, pressed filter chip, switch thumb and map pins; rgba() in skeleton shimmer, scrim, credit, cover gradient and cover edit button. | Every one is a token, so a dark theme is possible. |
| D18 | `weekend.html` | The map SVG carries 21 inline hex fills (no dark theme, no tokens). | `.map__land`, `.map__water`, `.map__road`, `.map__route`, `.map__pin` classes on tokens. |
| D19 | `app.css` | `.option` and `.option--simple` rules match no markup. | Dropped. |
| D20 | auth pages, `auth-card__alt` | `.link` is coral with no underline inside sentences ("No account? Create one"); colour alone separates it from the text (1.4.1). | `.link` is underlined; hover thickens the underline. |
| D21 | `weekend.html` | Block actions are hidden until hover or focus-within, so touch tablets at 720px or wider never see them. | `@media (hover: none)` keeps them visible. |
| D22 | every page | No skip link (2.4.1). | `skip-link` component; every page should start with it. |
| D23 | `admin.activity.html` | Tabular data (time, who, place, action, change) rendered as a div grid with no column headers. | `table` component for wide screens; `activity-feed` documents the stacked phone layout. |
| D24 | `app.css` | Breakpoints and type in px (379/576/719/720/1024; 12 to 56px), so they ignore the user's font size (1.4.4). | rem: 23.75 / 36 / 45 / 64rem; type tokens in rem. |
| D25 | all | No dark theme in the mocks or the product. | Dark theme built from roles (warm umber surfaces that lighten as they rise; lighter coral with dark labels). A proposal for the product, which ships light only. |
| D26 | `filter-chip--*` | Tinted pressed chips (leaf, sky, sun, indoor) differ from unpressed ones only by a pale fill (1.4.11). | Pressed tinted chips also take a border in their ink colour. |
| D27 | `chip__x` | The remove button is 16 × 16px, under the 24px target minimum (2.5.8). | 24px hit area via `::before`; the visible glyph stays 16px. |
| D28 | `.btn--quiet` | Quiet buttons use the 16% decorative stroke (1.36:1), so the edge disappears on cream. | `--colorNeutralStrokeAccessible` border. |
| D29 | `app.css` reduced motion | Every animation is cut to 0.001ms, which also freezes the loading spinner. | Durations are zeroed in tokens; the spinner keeps turning (status), shimmer and transitions stop. |
| D30 | `frontend/.../tooltip/tooltip-panel.scss` | Not a mock: the product tooltip still reads `--sd-*` tokens after the ADR-013 migration. | Noted for the product; the design-system tooltip matches its geometry on Fluent tokens. |
| D31 | `legal.html`, `review-submissions.html`, `admin.place.html` | External links open in a new tab without saying so (3.2.5 advisory, 2.4.4). | External icon plus visually hidden "(opens in a new tab)"; see `link`. |
| D32 | `weekend.html` | Four "Directions" links with identical text on one page (2.4.4). | Visible "Directions" plus visually hidden destination ("to Terre Bleu"). |
| D33 | `weekend.html` day header | The "Lock day" button is named "Lock Saturday", so its accessible name does not contain its visible label (2.5.3, level A). | "Lock day: Saturday" (visible label first). |
| D34 | `weekend.html`, `dialogs.html`, admin pages | Two clocks: the timeline uses 24-hour times (18:30), dialog subtitles use 12-hour with no am/pm ("11:00 to 1:00"); ranges are written three ways and admin timestamps two ways. | One format, documented on the content foundation page. |
| D35 | `dialogs.html` D10, D17 (add) | Submit is disabled until the form is valid, and D10's button is a generic "Submit". | Submit stays enabled and shows the error summary; labels name the action ("Send suggestion"). |
| D36 | `weekend.html` | Saturday's forecast exists only in an `aria-hidden` sun disc; the meta text never says "sunny" (1.1.1, 1.4.1). | Weather word in the day meta text. |
| D37 | admin mocks, sprite | `star` means both "rating" and "Make primary"; `arrow_right` and `chevron_right` draw the same glyph. | One meaning per icon (iconography page); a distinct primary-photo treatment is an open decision. |
| D38 | `sign-in.html`, field errors | The error banner and field errors use the close (×) glyph as a status icon, and the banner adds `aria-live="assertive"` on top of `role="alert"`. | `alert` icon; `role="alert"` alone. |
| D39 | `admin.sign-in.html` | Sign out on the admin gate is a danger button, though nothing is destroyed. | Quiet warn-text button, as on Family. |
| D40 | `weekend.html` | Numbered stop discs carry `aria-label="Stop 2"` on a `<span>`, which assistive technology ignores. | Visually hidden "Stop " text before the number. |
| D41 | `app.css` lists | `.list__item:last-child { border-bottom: 0 }` matches every action row (each is the last child of its `<li>`), so Family, D25 and admin Places lose all row dividers. | Divider set on `.list > li:not(:last-child) > .list__item`. |
| D42 | landing, legal, admin pages | Landmarks: the site footer sits inside `<main>`, the pager is a plain `<div>`, admin Places is a `<div>` of links, and the account avatar is a link to the dialog gallery rather than a menu button. | `footer`, `nav aria-label="Pagination"`, `ul`, and a `button aria-haspopup="menu"` in the component pages. |
| D43 | `weekend.html` | The Saturday/Sunday tabs respond to clicks only: no arrow keys, no roving tabindex. | APG Tabs keyboard model on the tabs page. |
| D44 | `.card--dimmed`, `.card--muted`, `.block--done` | Opacity takes meta text below 4.5:1 (about 2.5:1 dimmed, 4.4:1 muted). | `.block--done` now mutes with colour and a strikethrough; dimmed and muted cards are an open item on the card page. |
| D45 | `weekend.generating.html` | The primary page action comes last in the DOM, so on phones focus order differs from the visual order (2.4.3). | Primary first in the DOM, as the Angular `sd-page-header` already does. |
| D46 | `segments`, `seg-radio` | The selected segment differs from the track only by a small luminance step (1.4.11). | 1px `--colorNeutralStrokeAccessible` inner edge on the selected segment. |
| D47 | product (not a mock) | `sd-admin-nav` puts `aria-label="Admin"` on a host without a role (no landmark); `sd-text-input` hides the hint during an error but keeps it in `aria-describedby`; `sd-chip-input` drops duplicates silently; a bare `href="#main"` skip link resolves against `<base href="/">` and leaves the page. | Noted on the sidebar-navigation, inline-message, chip-input and skip-link pages for the product backlog. |

## Verification

Run on 2026-10-08 from the repo root.

| Check | Command | Result |
|---|---|---|
| Mocks gate | `node docs/mocks/.check.mjs` | 0 findings. |
| Contrast, both themes | `python <skill>/scripts/check_contrast.py docs/design-system/tokens/tokens.css` | 196 passed, 0 failed (98 pairs × light and dark). |
| Structure | `python <skill>/scripts/check_design_system.py docs/design-system` | 75 pages (12 foundations, 54 components, 8 patterns, index), 0 errors, 0 warnings. |
| DTCG export | `python docs/design-system/tokens/export_tokens.py` | 275 tokens written to `tokens.json`. |
| Overflow and screenshots | Playwright (Chromium), every page at 360 × 800 and 1280 × 900, light and dark | No horizontal page scroll on any of the 300 captures. Full-page shots of index, button, card, dialog, itinerary and color were reviewed by eye in both themes, with section crops at 360 and 1280. |

Not done, by decision: Step 8's "close the loop" (pointing `docs/mocks` at these tokens and `components.css`) was skipped. The mocks are the e2e visual baseline (ADR-010) and keep their own `tokens.css` (ADR-013 §5); the drift log is the hand-off instead.

Manual checks still worth doing before adopting values in the product: a screen-reader pass on the dialog, form-layout and table pages, 200% and 400% zoom, and Windows forced-colors mode.
