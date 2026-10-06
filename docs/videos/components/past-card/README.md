# 34 · Coding sd-past-card: a stateless card where every control emits

> **Runtime:** ~7.8 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 31 · sd-media](../media/README.md); `sd-button` (video 09)

**Video:** [past-card.mp4](past-card.mp4) · [Slides](slides.html) · **Audio:** [past-card.mp3](past-card.mp3) · [Transcript](script.md)

## Why this video exists

`sd-past-card` is a fully presentational card: six inputs in, six outputs out, no local state. It shows when to prefer `input()` + `output()` over `model()`, how `computed()` builds accessible labels, and how every control becomes a named button.

## Learning objectives

By the end, the viewer can:

- Compose `sd-media`, `sd-button`, `sd-icon` and `sd-stars` into a card host (`.card.card--media`).
- Emit the next favourite value from `favouriteToggle` and keep the page the source of truth.
- Derive `ratingLabel` and `rateLabel` with `computed()`.
- Make the heart an icon-only toggle with `label` and `aria-pressed`.
- Walk through the six tests in `past-card.spec.ts` and name what they don't cover.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why not `model()` for favourite? | The card would flip its own state; card and server could disagree if the save fails. |
| Why `rating` as `number | null`? | Distinguishes "not rated" (Rate it) from a score. |
| What isn't unit-tested here? | The Add-a-photo tile / `addPhoto` and the cover branch. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/past-card/past-card.ts` | Host, inputs, six outputs, two computed labels. |
| `frontend/projects/components/src/lib/past-card/past-card.html` | Cover/Add a photo, heart, title and rate buttons, footer. |
| `frontend/projects/components/src/lib/past-card/past-card.scss` | `card-host` mixin, clamp, `--sd-btn-w`, pressed heart. |
| `frontend/projects/saturdaze/src/app/pages/past/past.page.html` | All bindings. |
| `frontend/projects/components/src/lib/past-card/past-card.spec.ts` | Six tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:33 | Introduction | A stateless card. |
| 00:34-01:05 | Usage | Past page bindings. |
| 01:06-01:48 | Decorator | Imports and host classes; no mirrored inputs. |
| 01:49-02:51 | Inputs & outputs | Inputs, six outputs, why not `model()`. |
| 02:52-03:21 | Computed | `computed()` rating labels. |
| 03:22-04:47 | Template | Cover or Add a photo, heart toggle, title and rate buttons. |
| 04:48-05:34 | Styles | Mixin, clamp, knobs, pressed heart, tile. |
| 05:35-06:56 | Testing | Setup, the six tests, what's not covered. |
| 06:57-07:17 | Pitfalls | Local state, unlabelled heart, text click handlers, stale inputs. |
| 07:18-07:50 | Recap | Things to remember; next: `[sdScrolled]`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/past-card/past-card.spec.ts'
npm run storybook   # PastCard stories
```

## Pitfalls

- Letting the card toggle its own favourite state.
- A heart icon without `label` and `aria-pressed`.
- Rename/rate as click handlers on plain text.
- Not writing the dialog results back into the inputs.

## References

- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Signals — computed](https://angular.dev/guide/signals)
- [MDN: aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-pressed)
