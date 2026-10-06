# 29 · Coding sd-list: a list host and one boolean input

> **Runtime:** ~6.0 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Components series index](../README.md); [Video 05 · Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [list.mp4](list.mp4) · [Slides](slides.html) · **Audio:** [list.mp3](list.mp3) · [Transcript](script.md)

## Why this video exists

`sd-list` is a near-empty container, which makes it the clearest place to learn the `booleanAttribute` transform, host-attribute mirroring and passing layout down to children through a component knob (`--sd-list-pad-x`) instead of deep selectors.

## Learning objectives

By the end, the viewer can:

- Put the BEM class and `role="list"` in host metadata.
- Declare a boolean input with `transform: booleanAttribute` and mirror it as `card=""`.
- Explain why the component needs no `computed()` or `output()`.
- Pass padding to `sd-list-item` through the `--sd-list-pad-x` custom property.
- Read and extend `list.spec.ts` using `componentRef.setInput` and a host component.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What does `booleanAttribute` buy for one flag? | `<sd-list card>` (empty string) becomes `true`; the input stays a real boolean. |
| How do rows get 16px padding in a card? | The list sets `--sd-list-pad-x`; `.list__item` reads it; no `::ng-deep`. |
| Why must only list items be projected? | Each is `role="listitem"`; anything else breaks the announced item count. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/list/list.ts` | Host metadata and the `card` input. |
| `frontend/projects/components/src/lib/list/list.html` | `<ng-content />`. |
| `frontend/projects/components/src/lib/list/list.scss` | Card surface and `--sd-list-pad-x`. |
| `frontend/projects/components/src/lib/list-item/list-item.scss` | The row reading the knob. |
| `frontend/projects/components/src/lib/list/list.spec.ts` | Three tests. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | `<sd-list card>` with action rows and a ghost row after it. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:32 | Introduction | What the list owns. |
| 00:33-01:04 | Usage | Family page usage; other call sites. |
| 01:05-02:02 | Decorator | Selector, host class/role, mirrored `card`. |
| 02:03-02:47 | Input | `booleanAttribute`; what it doesn't need. |
| 02:48-03:43 | Template & styles | `<ng-content />`, the card surface, the padding knob. |
| 03:44-04:58 | Testing | Setup and the three tests. |
| 04:59-05:20 | Pitfalls | Ghost rows inside, missing transform, deep selectors. |
| 05:21-06:01 | Recap | Things to remember; next: `sd-list-item`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/list/list.spec.ts'   # or: npm test
npm run storybook                                          # List → Default, Plain, With ghost row
```

## Pitfalls

- Projecting non-item content (e.g. `sd-ghost-row`) inside the list.
- A boolean input without `booleanAttribute`.
- Styling rows from the list with `::ng-deep` instead of the knob.

## References

- [Angular: Inputs — input transforms](https://angular.dev/guide/components/inputs)
- [Angular: Content projection](https://angular.dev/guide/components/content-projection)
- [MDN: ARIA list role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/list_role)
- `docs/adr/ADR-013-fluent-design-tokens.md`
