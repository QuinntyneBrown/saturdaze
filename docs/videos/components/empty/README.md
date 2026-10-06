# 21 · Coding sd-empty: an empty state with a call to action

> **Runtime:** ~6.5 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 20 · sd-disc](../disc/README.md); [Consuming tokens](../../05-consuming-tokens/README.md)

**Video:** [empty.mp4](empty.mp4) · [Slides](slides.html) · **Audio:** [empty.mp3](empty.mp3) · [Transcript](script.md)

## Why this video exists

`sd-empty` is the centred card shown when a page has nothing to list yet. It composes `sd-disc`, reuses its `DiscTone` type, names itself through its heading with `aria-labelledby`, and takes its call to action as projected content rather than an output. This video builds it from its source and walks through its spec.

## Learning objectives

By the end, the viewer can:

- Alias an input (`title` → `emptyTitle`) and give it a useful default.
- Use `booleanAttribute` so the bare `warm` attribute means `true`.
- Reuse an exported type from another component (`DiscTone`).
- Generate a unique heading id from a module counter and bind `aria-labelledby` on the host.
- Declare the `[slot=cta]` and default slots once, with `@if` for optional text.
- Read and extend `empty.spec.ts`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why no `output()` for the button? | The CTA is projected; the consumer's own `sd-button` handles the click. |
| Why is `headingId` not a signal? | It is fixed at construction and never changes. |
| What happens with `<sd-empty warm>` without a transform? | The input would receive `''`; `booleanAttribute` turns it into `true`. |
| Why does an empty state without buttons leave no gap? | `.empty__cta:not(:has(*)) { display: none; }`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | Warm empty state with a CTA and note. |
| `frontend/projects/components/src/lib/empty/empty.ts` | Decorator, host bindings, six inputs, `headingId`. |
| `frontend/projects/components/src/lib/empty/empty.html` | Disc, heading, body, CTA row, default slot. |
| `frontend/projects/components/src/lib/empty/empty.scss` | Card tokens, warm gradient, type tokens, `:has` guard. |
| `frontend/projects/components/src/lib/empty/empty.spec.ts` | Host component and the five tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:32 | Introduction | What it is; the weekend page usage. |
| 00:32-01:20 | Decorator | Class, warm modifier, no reflected inputs (ADR-009), `aria-labelledby`. |
| 01:20-02:30 | Inputs | Aliased title, shared `DiscTone`, `booleanAttribute`, what it doesn't need. |
| 02:30-02:53 | Heading id | Counter-based id. |
| 02:53-03:33 | Template | Disc, heading, slots declared once. |
| 03:33-04:29 | Styles | Card, warm gradient, type tokens, empty-row guard. |
| 04:29-05:38 | Spec | Setup and five tests. |
| 05:38-05:57 | Pitfalls | Three mistakes. |
| 05:57-06:30 | Recap | Things to remember; preview of `sd-event-card`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/empty/empty.spec.ts'   # run the empty spec
npm run storybook                                             # Empty stories
```

## Pitfalls

- Adding an `output()` for the CTA instead of projecting a button.
- Forgetting `booleanAttribute` on a boolean input.
- Repeating `[slot=cta]` inside `@if` branches.

## References

- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: Content projection](https://angular.dev/guide/components/content-projection)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
