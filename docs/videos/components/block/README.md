# 06 · Coding sd-block: host listeners, two outputs and a timeline row

> **Runtime:** ~7.9 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [02 · sd-auth-card](../auth-card/README.md), [05 · sd-banner](../banner/README.md)

**Video:** [block.mp4](block.mp4) · [Slides](slides.html) · **Audio:** [block.mp3](block.mp3) · [Transcript](script.md)

## Why this video exists

`sd-block` is one row of a day's timeline on Weekend, the shared weekend and the landing miniature. It is the richest component so far: six boolean modifiers, two outputs, host event listeners, a programmatic-focus `tabindex` and a `focusout` check. It shows how a component reports interaction while the page keeps the state.

## Learning objectives

By the end, the viewer can:

- Give the host `role="listitem"` and one `[class.block--…]` binding per flag, without reflecting inputs as attributes.
- Use `tabindex="-1"` (via a nullable host binding) for programmatic focus without joining the tab order.
- Declare host event listeners in the `host` map and emit a typed `output<boolean>()`.
- Keep the active state in the page: `activeChange` up, `[active]` down.
- Ignore focus moving within the row by checking `relatedTarget` in `focusLeft`.
- Declare the `chips` and `actions` slots once and name the stop disc and chevron for screen readers.
- Explain what each test in `block.spec.ts` proves, and which behaviours it does not cover yet.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `tabindex="-1"` only for numbered stops? | The Weekend page focuses the row when its map pin is activated; `-1` keeps it out of the tab order. |
| Why not a two-way `model()` for `active`? | The page owns `activeStop()` for the map too; the block only reports enter/leave. |
| What does `focusLeft` prevent? | Tabbing between the row's own buttons flickering the highlight off and on. |
| Why does the host carry no `title`, `time` or flag attributes? | Inputs stay inputs (ADR-009): a host `title` is a native tooltip on every row (the old `title=""` workaround on the actions region is gone), and nothing read the others. Only classes and ARIA state go on the host. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | The real usage with `stopNumber`, `active`, `activeChange`, `details`. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.ts` | `el.focus({ preventScroll: true })`. |
| `frontend/projects/components/src/lib/block/block.ts` | Host map, inputs, outputs, `focusLeft`. |
| `frontend/projects/components/src/lib/block/block.html` | Time, rail, body, actions, chevron. |
| `frontend/projects/components/src/lib/block/block.scss` | Grid, `respond-to(tablet)`, `:focus-visible`. |
| `frontend/projects/components/src/lib/block/block.spec.ts` | Seven tests and the gaps. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:40 | Introduction | A timeline row; where it is used. |
| 00:41-02:23 | Decorator | `listitem`, modifier classes, `tabindex`, host listeners, why inputs are no longer reflected. |
| 02:24-03:23 | Inputs | Aliased title, boolean flags, `stopNumber`, `active`, two outputs. |
| 03:24-03:49 | Focus | `focusLeft` and `relatedTarget`. |
| 03:50-04:52 | Template | Time, rail, stop `aria-label`, slots, chevron. |
| 04:53-05:24 | Styles | Grid, paired tints, tablet actions, focus outline. |
| 05:25-06:55 | Tests | Setup, seven tests, what is not covered. |
| 06:56-07:18 | Pitfalls | Tab order, focusout, state ownership, reflected `title`. |
| 07:19-07:55 | Recap | Things to remember; preview of video 07. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/block/*.spec.ts'
npm run storybook          # Components → Block
```

## Pitfalls

- Putting rows in the tab order with `tabindex="0"`.
- Emitting `false` on every `focusout` without checking `relatedTarget`.
- Keeping the active state inside the block instead of the page.
- Reflecting the `title` input onto the host, which brings back native tooltips on every row.
- Changing `stopNumber`, `active`, `activeChange` or `focusLeft` without first adding the missing tests.

## References

- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Binding to the host element](https://angular.dev/guide/components/host-elements)
- [MDN: FocusEvent.relatedTarget](https://developer.mozilla.org/en-US/docs/Web/API/FocusEvent/relatedTarget)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
