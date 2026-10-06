# 12 · Coding sd-chip: tones, sizes and an output

> **Runtime:** ~7.4 min · **Audience:** developers who know basic Angular and want to build or change `sd-chip` · **Prerequisites:** [Video 10 · sd-card](../card/README.md); [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [chip.mp4](chip.mp4) · [Slides](slides.html) · **Audio:** [chip.mp3](chip.mp3) · [Transcript](script.md)

## Why this video exists

`sd-chip` is the most-used label in the app (idea cards, Family, Review submissions, and inside `sd-day`, `sd-food-card` and `sd-chip-input`). It adds two things to the host-is-the-block pattern from `sd-card`: an `output()` for the remove action and a conditional native button with an accessible name, plus tone styles built from fill/ink token pairs.

## Learning objectives

By the end, the viewer can:

- Map a union-typed `tone` input to host modifier classes, without reflecting it as a host attribute (ADR-009).
- Declare an event with `output<void>()` and leave the decision to the parent.
- Render a conditional `type="button"` remove button with a bound `aria-label`, keeping the slot outside the `@if`.
- Style tones with paired `…Background1` / `…Foreground1` tokens.
- Test an `output()` by subscribing a mock and clicking.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `output()` instead of `@Output()`? | Typed, consistent with signal inputs, no `EventEmitter`; still subscribable in tests. |
| Why doesn't the chip remove itself? | The parent owns the list; the chip only reports intent. |
| Why `imports: [Icon]`? | A standalone component must import every component its template uses. |
| Why `type="button"`? | A default button submits a surrounding form. |
| Is there a hex value? | Yes, `#fff` on `.chip--ink`; prefer a token if you change it. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/chip/chip.ts` | Types, decorator, host, inputs, output. |
| `frontend/projects/components/src/lib/chip/chip.html` | Slot and conditional remove button. |
| `frontend/projects/components/src/lib/chip/chip.scss` | Host pill, tone pairs, icon size, `sm`, `count`. |
| `frontend/projects/components/src/lib/chip/chip.spec.ts` | Six tests. |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | Leaf/warn chips and the count chip. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:39 | Introduction | Title; Where the app uses it. |
| 00:40-01:51 | Decorator | Types first; The decorator imports what it renders. |
| 01:52-03:03 | Inputs & output | Five inputs, one output; output(): report, don't decide; Not needed here. |
| 03:04-03:46 | Template | The template. |
| 03:47-05:00 | Styles | The host is the pill; Tones as fill + ink pairs; Icon size, small, count. |
| 05:01-06:20 | Spec | Spec setup; Host classes; The remove button; Testing an output(). |
| 06:21-06:47 | Pitfalls | Pitfalls. |
| 06:48-07:24 | Recap | Things to remember; preview of `sd-chip-input`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/chip/chip.spec.ts'   # run the chip spec
npm run storybook                                         # Components → Chip
grep -rn "<sd-chip\b" projects/saturdaze/src              # find usages
```

## Pitfalls

- Letting the chip mutate state it does not own.
- A generic `Remove` label for every chip in a list.
- Dropping `type="button"` on the remove button.
- Mixing a fill from one tone with the ink of another.
- Forgetting `imports: [Icon]`.

## References

- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Accepting data with input properties](https://angular.dev/guide/components/inputs)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
