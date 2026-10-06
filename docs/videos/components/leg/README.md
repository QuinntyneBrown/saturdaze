# 28 · Coding sd-leg: a tiny, honest timeline row

> **Runtime:** ~6.4 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Components series index](../README.md); [Video 05 · Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [leg.mp4](leg.mp4) · [Slides](slides.html) · **Audio:** [leg.mp3](leg.mp3) · [Transcript](script.md)

## Why this video exists

`sd-leg` is the smallest row on the Weekend timeline. It shows how far a component can get with plain signal inputs and host metadata, and — because its folder has no `leg.spec.ts` — what a spec for it should prove.

## Learning objectives

By the end, the viewer can:

- Write a component whose host is the BEM block (`.leg`) with `role="listitem"` and a nullable `aria-label`.
- Use plain `input()` signals and explain why this component needs no `input.required`, `booleanAttribute`, `computed()` or `output()`.
- Mark decorative elements `aria-hidden` and pair `target="_blank"` with `rel="noopener"`.
- Style a three-column grid and a dotted rail with tokens by role.
- List the behaviours a missing spec should cover.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why bind `aria-label` to `ariaLabel() || null`? | Null removes the attribute; an empty string would leave an unnamed list item. |
| Why is the host `role="listitem"`? | It sits in the day's list beside the `sd-block` rows, matching the mock's `<li class="leg">`. |
| Why no outputs? | The only interaction is a plain external link. |
| Is there a unit test? | No — `leg.spec.ts` does not exist; it is exercised by `e2e/pages/weekend.page.ts` and the stories. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/leg/leg.ts` | Decorator, host metadata, three inputs. |
| `frontend/projects/components/src/lib/leg/leg.html` | Empty span, rail, text, conditional Directions link. |
| `frontend/projects/components/src/lib/leg/leg.scss` | Grid host, dotted rail, link colour. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | `<sd-leg>` before each `<sd-block>`. |
| `docs/mocks/pages/weekend.html` | The `.leg` markup to match. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:28 | Introduction | What a leg is; no spec yet. |
| 00:29-01:25 | Usage | Weekend page usage; the mock shape (ADR-009). |
| 01:26-02:17 | Decorator | Selector, OnPush, host class/role/aria-label. |
| 02:18-03:01 | Inputs | Three signal inputs; what it doesn't need. |
| 03:02-03:38 | Template | Rail, car icon, label, Directions link, `noopener`. |
| 03:39-04:32 | Styles | Grid, dotted rail, text and link tokens. |
| 04:33-05:25 | Testing | No spec: what exists today and what a spec should prove. |
| 05:26-05:47 | Pitfalls | Wrapper divs, empty aria-label, noopener, the empty span. |
| 05:48-06:22 | Recap | Things to remember; next: `sd-list`. |

## Demo commands

```sh
cd frontend
npm run storybook                       # Leg → Default, Short
npx playwright test --project=chromium   # from e2e/: weekend specs use the leg via weekend.page.ts
```

## Pitfalls

- Wrapping the host in an extra element (breaks the grid and mock parity).
- Writing `aria-label=""` instead of removing the attribute.
- A new-tab link without `rel="noopener"`.
- Dropping the empty first span, so the rail slides into the time column.

## References

- [Angular: Accepting data with input properties](https://angular.dev/guide/components/inputs)
- [Angular: Component host elements](https://angular.dev/guide/components/host-elements)
- [MDN: rel=noopener](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/noopener)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
