# 33 · Coding sd-page-header: the title, the actions and three slots

> **Runtime:** ~7.3 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 30 · sd-list-item](../list-item/README.md); `sd-button` (video 09)

**Video:** [page-header.mp4](page-header.mp4) · [Slides](slides.html) · **Audio:** [page-header.mp3](page-header.mp3) · [Transcript](script.md)

## Why this video exists

`sd-page-header` is on every core screen. It shows how three named slots let one component lay out projected buttons differently on phones and wider screens, how a back affordance renders twice and shows once, and why consumers need one `@if` per slotted node.

## Learning objectives

By the end, the viewer can:

- Build a header with `[slot=primary]`, `[slot=actions]` and `[slot=more]`, each declared once.
- Use `alias: 'title'` and an optional `inject(Router)`, keeping inputs off the host (ADR-009).
- Render the eyebrow link (≥720px) and the ghost back button (<720px) from one `backHref`.
- Lay out projected `display: contents` buttons with `::ng-deep` scoped rules and `--sd-btn-h`.
- Walk through the six tests in `page-header.spec.ts`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why one `@if` per slotted button in the Weekend page? | A single `@if` around several `[slot=…]` nodes loses the slot (NG8011). |
| Why `::ng-deep` here? | Projected `sd-button` hosts are `display: contents`; the inner `.btn` is the grid item. |
| How do phones and tablets differ? | Grid with full-width primary and 2-up quiet buttons below 720px; a wrapping flex row from 720px. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/page-header/page-header.ts` | Host class, inputs, `onBack`. |
| `frontend/projects/components/src/lib/page-header/page-header.html` | Eyebrow, back button, h1, three slots. |
| `frontend/projects/components/src/lib/page-header/page-header.scss` | Grid, `::ng-deep`, `respond-to(tablet)`. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | Full form with three slotted buttons. |
| `frontend/projects/saturdaze/src/app/pages/review-submissions/review-submissions.page.html` | `backHref` usage. |
| `frontend/projects/components/src/lib/page-header/page-header.spec.ts` | Six tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:30 | Introduction | The first thing on every screen. |
| 00:31-01:16 | Usage | Past, Family, Weekend, Review submissions; one `@if` per node. |
| 01:17-01:52 | Decorator | Selector, imports, host class; no mirrored inputs. |
| 01:53-02:48 | Inputs | `inject()`, title alias, back inputs; no outputs or computed. |
| 02:49-03:51 | Template | Eyebrow, back button, h1, three slots. |
| 03:52-05:07 | Styles | Phone grid, `::ng-deep`, `:has()`, tablet flex row. |
| 05:08-06:23 | Testing | Setup and the six tests. |
| 06:24-06:44 | Pitfalls | Shared `@if`, too many actions, unlabelled More, page-side layout. |
| 06:45-07:20 | Recap | Things to remember; next: `sd-past-card`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/page-header/page-header.spec.ts'
npm run storybook   # PageHeader stories
```

## Pitfalls

- One `@if` wrapping several slotted buttons.
- More than one primary or more than two quiet actions.
- An icon-only More button without `label`.
- Laying out header buttons from the page instead of the header.

## References

- [Angular: Content projection](https://angular.dev/guide/components/content-projection)
- [Angular: Component styling — ::ng-deep](https://angular.dev/guide/components/styling)
- `docs/adr/ADR-009-v2-responsive-shell.md`
