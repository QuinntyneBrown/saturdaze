# 31 · Coding sd-media: a photo frame with a graceful fallback

> **Runtime:** ~7.5 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Components series index](../README.md); [Video 05 · Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [media.mp4](media.mp4) · [Slides](slides.html) · **Audio:** [media.mp3](media.mp3) · [Transcript](script.md)

## Why this video exists

`sd-media` is the photo frame on every idea card. It is a compact lesson in local state: one private `signal()` for the failed image source and one `computed()` for the fallback, with no `effect()`, plus layout-shift-free images and a decorative, `aria-hidden` fallback tile.

## Learning objectives

By the end, the viewer can:

- Export the `CardMedia` shape and `MediaTone` / `MediaRatio` union types next to the component.
- Derive `fallback` with `computed()` from `photo()` and a private `failedSrc` signal.
- Explain why storing the failed source avoids an `effect()` when the photo changes.
- Render an image with explicit `width`/`height`, lazy loading and an `(error)` handler.
- Style the credit scrim through `--sd-media-credit-bg` and tones with fill/ink token pairs.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `failedSrc` instead of a boolean? | A new photo no longer matches the failed source, so nothing needs resetting. |
| Why `aria-hidden` on the fallback? | The tile is decorative; the card title carries the meaning. Real photos keep their `alt`. |
| How does it avoid layout shift? | Fixed `aspect-ratio` plus `width`/`height` attributes on the image. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/media/media.ts` | Types, host bindings, inputs, signal + computed. |
| `frontend/projects/components/src/lib/media/media.html` | `@let`, image, credit, icon fallback. |
| `frontend/projects/components/src/lib/media/media.scss` | Frame, credit scrim, tones. |
| `frontend/projects/components/src/lib/media/media.spec.ts` | Five tests. |
| `frontend/projects/components/src/lib/food-card/food-card.html` | A consumer passing tone and icon. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:29 | Introduction | The frame and its fallback. |
| 00:30-00:57 | Usage | Composed by activity, food, event and past cards. |
| 00:58-01:40 | Types | `CardMedia` and the union types. |
| 01:41-02:34 | Decorator | Host class bindings and `aria-hidden`. |
| 02:35-03:40 | State | Five inputs; `signal()` + `computed()`; why not a boolean. |
| 03:41-04:24 | Template | `@let`, sized lazy image, `(error)`, credit. |
| 04:25-05:21 | Styles | Frame, credit scrim knob, tone pairs. |
| 05:22-06:29 | Testing | Setup and the five tests. |
| 06:30-06:49 | Pitfalls | Layout shift, effects, announced tiles, missing credit. |
| 06:50-07:27 | Recap | Things to remember; next: `sd-menu`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/media/media.spec.ts'
npm run storybook   # Media → Default, Fallback, Ratio
```

## Pitfalls

- Dropping `width`/`height` (layout shift).
- Using an `effect()` to reset a failed flag when the photo changes.
- Leaving the fallback tile exposed to screen readers.
- Dropping the credit (the licence requires it).

## References

- [Angular: Signals — computed](https://angular.dev/guide/signals)
- [Angular: @let](https://angular.dev/api/core/@let)
- [MDN: img loading](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading)
- `docs/adr/ADR-013-fluent-design-tokens.md`
