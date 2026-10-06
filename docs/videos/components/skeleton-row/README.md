# 41 · Coding sd-skeleton-row: a decorative loading placeholder

> **Runtime:** ~5.1 min · **Audience:** developers who know basic Angular · **Prerequisites:** none

**Video:** [skeleton-row.mp4](skeleton-row.mp4) · [Slides](slides.html) · **Audio:** [skeleton-row.mp3](skeleton-row.mp3) · [Transcript](script.md)

## Why this video exists

`sd-skeleton-row` fills the Weekend and shared weekend day columns while a plan loads or regenerates. It has no inputs at all, which makes it a clean example of a purely decorative component: static host bindings (`aria-hidden`), BEM shape modifiers, a token-based shimmer that stops under reduced motion, and a spec that proves the shape and the silence.

## Learning objectives

By the end, the viewer can:

- Write a component with no inputs and explain why that is a valid design.
- Use static `host` entries for the BEM class and `aria-hidden="true"`.
- Pair hidden placeholders with `aria-busy="true"` on the container.
- Build a shimmer with a `::after` pseudo-element and `@keyframes`, disabled under `prefers-reduced-motion`.
- Read a spec that asserts structure and the absence of text.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why is the row `aria-hidden`? | Placeholders carry no information; the container's `aria-busy` announces loading. |
| Why match the real row's geometry? | The layout doesn't jump when the blocks replace the placeholders. |
| What happens under reduced motion? | `.skeleton::after { animation: none; }` keeps the shapes, drops the movement. |
| What does "has no text for assistive tech to read" guard? | The decorative contract: no loading text inside the row. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | The loading case with `aria-busy` and skeleton rows. |
| `frontend/projects/components/src/lib/skeleton-row/skeleton-row.ts` | The whole component. |
| `frontend/projects/components/src/lib/skeleton-row/skeleton-row.html` | Four shapes. |
| `frontend/projects/components/src/lib/skeleton-row/skeleton-row.scss` | Grid, shimmer, reduced motion. |
| `frontend/projects/components/src/lib/skeleton-row/skeleton-row.spec.ts` | Setup and the three tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:27 | Introduction | Coding sd-skeleton-row. |
| 00:28-01:01 | Usage | Where it is used; Same shape, no jump. |
| 01:02-01:56 | Decorator | The whole component; Who announces "loading"?; No inputs is a design. |
| 01:57-02:24 | Template | The template: four shapes. |
| 02:25-03:37 | Styles | The host is the row; The shimmer; Respect reduced motion. |
| 03:38-04:20 | Tests | Spec setup: the minimum; What each test proves; Testing the silence. |
| 04:21-04:36 | Pitfalls | Pitfalls. |
| 04:37-05:08 | Recap | Things to remember; Coding sd-spinner. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/skeleton-row/skeleton-row.spec.ts'   # run the skeleton-row spec
npm run storybook                                                                        # open the SkeletonRow stories
```

## Pitfalls

- Forgetting `aria-busy="true"` on the container.
- Adding loading text inside the row; use `sd-status-row` for messages.
- Changing the animation and dropping the reduced-motion rule.

## References

- [MDN: aria-busy](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-busy)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
