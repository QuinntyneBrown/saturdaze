# 24 · Coding sd-filters: a labelled row that scrolls or wraps

> **Runtime:** ~6.1 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 23 · sd-filter-chip](../filter-chip/README.md); [Consuming tokens](../../05-consuming-tokens/README.md)

**Video:** [filters.mp4](filters.mp4) · [Slides](slides.html) · **Audio:** [filters.mp3](filters.mp3) · [Transcript](script.md)

## Why this video exists

`sd-filters` holds the filter chips on Ideas and Past. It is almost all host bindings and styles: a named `role="group"`, one boolean input that switches between the mock's `.scroller-x` and `.filters` layouts, and a full-bleed scroller built on the responsive `--layoutGutter` token.

## Learning objectives

By the end, the viewer can:

- Give a group of controls an accessible name with a static `role` and a bound `aria-label`.
- Use `booleanAttribute` on an input whose default is `true` (`scroll="false"`).
- Switch between two mock classes from one signal in host bindings.
- Explain the full-bleed scroller (negative margin + padding from `--layoutGutter`, edge mask) and the tablet reset.
- Read `filters.spec.ts`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `role="group"` with a label? | Screen readers announce the chips as one named set. |
| Why no `computed()` for the classes? | `scroll()` and `!scroll()` are read directly; nothing worth memoising. |
| How does the scroller reach the screen edges? | `margin-inline: calc(-1 * var(--layoutGutter))` with matching padding. |
| Is `#000` in the mask a token violation? | No, it is mask alpha, not a colour. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/ideas-events/ideas-events.page.html` | Two chip groups and an `sd-vdivider`. |
| `frontend/projects/components/src/lib/filters/filters.ts` | Decorator, host bindings, two inputs. |
| `frontend/projects/components/src/lib/filters/filters.html` | One `ng-content`. |
| `frontend/projects/components/src/lib/styles/_global.scss` | `.sd-vdivider`. |
| `frontend/projects/components/src/lib/filters/filters.scss` | `.filters`, `.scroller-x`, `respond-to(tablet)`. |
| `frontend/projects/components/src/lib/filters/filters.spec.ts` | Five tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:37 | Introduction | What it is; usages. |
| 00:37-01:41 | Decorator | Group role, label, two classes; no reflected input (ADR-009). |
| 01:41-02:31 | Inputs | `label`, `scroll` with `booleanAttribute`; what it doesn't need. |
| 02:31-03:13 | Template | One slot; the divider utility. |
| 03:13-04:25 | Styles | Wrapping row, full-bleed scroller, tablet reset. |
| 04:25-05:15 | Spec | Five tests. |
| 05:15-05:35 | Pitfalls | Four mistakes. |
| 05:35-06:07 | Recap | Things to remember; preview of `sd-food-card`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/filters/filters.spec.ts'   # run the filters spec
npm run storybook                                                 # Filters stories
```

## Pitfalls

- Dropping the label (an unnamed group).
- Adding a wrapper element inside the host.
- Hard-coding the bleed instead of using `--layoutGutter`.
- Putting dividers inside chips.

## References

- [MDN: ARIA group role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/group_role)
- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
