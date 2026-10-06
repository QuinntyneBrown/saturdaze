# 23 · Coding sd-filter-chip: a toggle that doesn't own its state

> **Runtime:** ~6.7 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md)

**Video:** [filter-chip.mp4](filter-chip.mp4) · [Slides](slides.html) · **Audio:** [filter-chip.mp3](filter-chip.mp3) · [Transcript](script.md)

## Why this video exists

`sd-filter-chip` is the toggle in the filter rows of Ideas and Past. It shows a pressed state through `aria-pressed` but never flips itself: it emits the next state through `pressedChange` and the page decides. This video builds it from source, explains why it uses `input()` + `output()` rather than `model()`, and walks through the spec test that encodes that rule.

## Learning objectives

By the end, the viewer can:

- Choose `input()` + `output()` over `model()` when the parent owns the state.
- Use `booleanAttribute` for `pressed` and `disabled`.
- Build a class object with a protected `computed()` and bind it with `[class]`.
- Make a toggle button accessible with `type="button"` and `[attr.aria-pressed]`, and style from that attribute.
- Explain `:host { display: contents }` in a flex row.
- Read `filter-chip.spec.ts`, especially the ownership test.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why not `model()`? | `model()` would write the value locally, so the chip would look pressed before the page decides (single-select windows, toggling categories). |
| Why style `[aria-pressed='true']`? | Visual and accessible state can't disagree. |
| What does the ownership test prove? | After a click the output fires `true` but `aria-pressed` stays `false` until the input changes. |
| Is there a hex value? | Yes, `color: #fff` on the default pressed state; the theme has no inverted-foreground token yet. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/ideas-events/ideas-events.page.html` | Chips inside `sd-filters`. |
| `frontend/projects/saturdaze/src/app/pages/ideas-events/ideas-events.page.ts` | `setWindow`. |
| `frontend/projects/components/src/lib/filter-chip/filter-chip.ts` | Type, decorator, inputs, output, `classes`, `toggle`. |
| `frontend/projects/components/src/lib/filter-chip/filter-chip.html` | The button. |
| `frontend/projects/components/src/lib/filter-chip/filter-chip.scss` | Pill, pressed states, hover media query. |
| `frontend/projects/components/src/lib/filter-chip/filter-chip.spec.ts` | Six tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:23 | Introduction | What it is; usage. |
| 00:23-01:16 | Decorator | Tone type, no host object (inputs not reflected, ADR-009), `display: contents`. |
| 01:16-02:20 | Inputs | Inputs, `pressedChange`, why not `model()`. |
| 02:20-03:02 | Computed | `classes`, guarded `toggle()`. |
| 03:02-03:36 | Template | Toggle button semantics, one slot. |
| 03:36-04:44 | Styles | Pill, pressed by `aria-pressed`, tone triples, hover. |
| 04:44-05:51 | Spec | Setup, ownership test, guard, slot. |
| 05:51-06:09 | Pitfalls | Four mistakes. |
| 06:09-06:40 | Recap | Things to remember; preview of `sd-filters`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/filter-chip/filter-chip.spec.ts'   # run the filter-chip spec
npm run storybook                                                         # FilterChip stories
```

## Pitfalls

- Switching `pressed` to `model()`.
- Styling a parallel class instead of `[aria-pressed='true']`.
- Dropping `type="button"`.
- Giving the host its own box.

## References

- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Model inputs](https://angular.dev/guide/components/inputs#model-inputs)
- [MDN: aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
