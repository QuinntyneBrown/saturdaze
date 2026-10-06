# 30 · Coding sd-list-item: one row, three elements, slots declared once

> **Runtime:** ~7.7 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 29 · sd-list](../list/README.md)

**Video:** [list-item.mp4](list-item.mp4) · [Slides](slides.html) · **Audio:** [list-item.mp3](list-item.mp3) · [Transcript](script.md)

## Why this video exists

`sd-list-item` renders a `<div>`, an in-app `<a>` or a `<button>` depending on its inputs, and its projected content must land in whichever one renders. It is the reference example of the library rule: declare each `ng-content` slot once, in an `<ng-template>`, and render it with `ngTemplateOutlet`.

## Learning objectives

By the end, the viewer can:

- Build a row whose element depends on `href` / `action` without duplicating `ng-content` slots.
- Use `alias: 'title'`, `booleanAttribute` flags, `output()` and an optional `inject(Router)`.
- Keep inputs off the host: only `role` and the mock's classes/ARIA state go there (ADR-009).
- Route plain clicks in-app with `navigateInApp` while keeping a real `href`.
- Read the parent's `--sd-list-pad-x` knob and collapse empty columns with `:has()`.
- Walk through the six tests in `list-item.spec.ts`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why one `<ng-template #body>`? | Projection is resolved at compile time; slots repeated per `@if` branch project into one branch only. |
| Why `rowTitle` with `alias: 'title'`? | Avoids colliding with the element's native `title` property; templates still write `title`. |
| What happens when both `href` and `action` are set? | `href` wins: the row is an `<a>`, and the spec asserts there is no `<button>`. |
| Why isn't `title` reflected onto the host? | A host `title` attribute shows a native browser tooltip on every row; nothing reads it (ADR-009). |
| Which clicks does the router take? | Plain primary clicks on paths starting with a single `/`; modifier clicks and external links fall through. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/list-item/list-item.ts` | Host role, inputs, `pressed`, `onAnchorClick`. |
| `frontend/projects/components/src/lib/list-item/list-item.html` | `#body` template and the three branches. |
| `frontend/projects/components/src/lib/list-item/list-item.scss` | Grid row, `:has()` collapse, hover. |
| `frontend/projects/components/src/lib/shared/in-app-link.ts` | `navigateInApp`. |
| `frontend/projects/components/src/lib/list-item/list-item.spec.ts` | Six tests. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | Action rows with avatars. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:32 | Introduction | Div, link or button; slots must follow. |
| 00:33-01:03 | Usage | Family, Weekend and errand-added usages. |
| 01:04-01:49 | Decorator | Selector, imports, role; inputs stay inputs (ADR-009). |
| 01:50-03:08 | Inputs | `inject(Router)`, alias, flags, `pressed`, in-app clicks. |
| 03:09-04:31 | Template | The `#body` template, three branches, why slots are declared once. |
| 04:32-05:11 | Styles | Grid row, padding knob, `:has()`, hover tokens. |
| 05:12-06:43 | Testing | Setup and the six tests. |
| 06:44-07:05 | Pitfalls | Duplicated slots, unaliased title, click on static rows, nested controls. |
| 07:06-07:44 | Recap | Things to remember; next: `sd-media`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/list-item/list-item.spec.ts'
npm run storybook   # ListItem stories
```

## Pitfalls

- Repeating `ng-content` in each `@if` branch — projected content silently disappears.
- Naming the input field `title` without an alias.
- A click handler on a static row instead of `action` or `href`.
- A toggle in the trailing slot of an `action` row (nested interactive controls).

## References

- [Angular: Content projection](https://angular.dev/guide/components/content-projection)
- [Angular: NgTemplateOutlet](https://angular.dev/api/common/NgTemplateOutlet)
- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: inject()](https://angular.dev/api/core/inject)
- `docs/adr/ADR-009-v2-responsive-shell.md`
