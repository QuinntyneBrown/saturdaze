# 25 · Coding sd-food-card: states, votes and two outputs

> **Runtime:** ~7.0 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 22 · sd-event-card](../event-card/README.md); [Consuming tokens](../../05-consuming-tokens/README.md)

**Video:** [food-card.mp4](food-card.mp4) · [Slides](slides.html) · **Audio:** [food-card.mp3](food-card.mp3) · [Transcript](script.md)

## Why this video exists

`sd-food-card` is the restaurant pick on Ideas · Food. Building on the event card, it adds three visual states (top pick, locked, dimmed) driven by boolean inputs, relays a typed output from the nested `sd-vote-row`, and reports "Lock it in" through a second output. It also has an unused `tone` input, which the video calls out honestly.

## Learning objectives

By the end, the viewer can:

- Map boolean signal inputs (`booleanAttribute`) to BEM modifier classes on the host.
- Use a `readonly VoteCell[]` input and a typed `output<{ index: number; vote: Vote }>()`.
- Relay a nested component's output (`(voteChange)="voteChange.emit($event)"`) instead of handling it.
- Show exactly one state chip with `@if` / `@else if`.
- Style states with `card-host` plus small `:host(.card--…)` rules.
- Read `food-card.spec.ts` and spot an unused input.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Who decides which card is locked or dimmed? | The page; the card only emits `lockIn` and renders the inputs it is given. |
| Why does a locked top pick show one chip? | `@if (locked())` comes before `@else if (topPick())`. |
| Why `padding: 15px` on the locked card? | The 2px border replaces a 1px one; one less pixel of padding keeps the size. |
| What is wrong with `tone`? | It is declared and bound by the page but never read by the template. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/ideas-food/ideas-food.page.html` | The real bindings. |
| `frontend/projects/components/src/lib/food-card/food-card.ts` | Decorator, eleven inputs, two outputs. |
| `frontend/projects/components/src/lib/vote-row/vote-row.ts` | `Vote`, `VoteCell`. |
| `frontend/projects/components/src/lib/food-card/food-card.html` | Media, state chip, vote row relay, footer. |
| `frontend/projects/components/src/lib/food-card/food-card.scss` | `card-host` and modifiers. |
| `frontend/projects/components/src/lib/food-card/food-card.spec.ts` | Nine tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:38 | Introduction | What it is; three states; usage. |
| 00:38-01:31 | Decorator | Imports, modifier classes; no reflected inputs (ADR-009). |
| 01:31-03:03 | Inputs | Eleven inputs, `VoteCell`, unused `tone`, two outputs. |
| 03:03-04:22 | Template | State chip, vote row relay, footer. |
| 04:22-04:56 | Styles | Mixin and modifiers. |
| 04:56-06:12 | Spec | Setup, state tests, vote relay. |
| 06:12-06:26 | Pitfalls | Three mistakes. |
| 06:26-07:03 | Recap | Things to remember; preview of `sd-ghost-row`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/food-card/food-card.spec.ts'   # run the food-card spec
npm run storybook                                                     # FoodCard stories
```

## Pitfalls

- Deciding locking inside the card.
- Handling a nested output instead of relaying it.
- Keeping inputs the template never reads (`tone`).

## References

- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [Angular: Control flow](https://angular.dev/guide/templates/control-flow)
- `docs/specs/L2.md` (L2-106), `docs/adr/ADR-009-v2-responsive-shell.md`
