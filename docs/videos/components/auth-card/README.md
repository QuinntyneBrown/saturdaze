# 02 · Coding sd-auth-card: four slots and a centred head

> **Runtime:** ~6.2 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [01 · sd-activity-card](../activity-card/README.md)

**Video:** [auth-card.mp4](auth-card.mp4) · [Slides](slides.html) · **Audio:** [auth-card.mp3](auth-card.mp3) · [Transcript](script.md)

## Why this video exists

`sd-auth-card` frames every signed-out form (sign in, create account, reset password, verify email). It has three inputs and no behaviour, which makes it a clean lesson in content projection: one default slot and three named slots, each declared once, plus a boolean flag mirrored to a class and an attribute.

## Learning objectives

By the end, the viewer can:

- Write a standalone, OnPush component whose host is the mock's `.auth-card` block.
- Mirror inputs to host attributes, using `null` to remove an attribute.
- Use `alias: 'title'` and `transform: booleanAttribute` on signal inputs.
- Declare the `disc`, `head`, default and `alt` slots once each, and explain where each lands.
- Hide an empty projected region with `:not(:has(*))` and use `respond-to(tablet)` for breakpoints.
- Explain what each test in `auth-card.spec.ts` proves.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why no outputs? | The projected form owns its submit; the card is layout only. |
| Where does a node without a `slot` attribute go? | Into the default `<ng-content />`, the card body. |
| Why is the title an `h1`? | On these pages the card title is the page title; screen reader users navigate by headings. |
| How is an empty alt line avoided? | `.auth-card__alt:not(:has(*)) { display: none; }` |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/reset-password/reset-password.page.html` | A centred card with disc, head and alt slots. |
| `frontend/projects/components/src/lib/auth-card/auth-card.ts` | Decorator, host bindings, three inputs. |
| `frontend/projects/components/src/lib/auth-card/auth-card.html` | The whole template: four slots. |
| `frontend/projects/components/src/lib/auth-card/auth-card.scss` | Host card styles, `:has` rule, `respond-to(tablet)`, `::ng-deep [slot='disc']`. |
| `frontend/projects/components/src/lib/auth-card/auth-card.spec.ts` | Host component, four tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:34 | Introduction | What the card is; where the auth pages use it. |
| 00:35-01:24 | Decorator | Selector, OnPush, `auth-card` host class, mirrored attributes. |
| 01:25-02:06 | Inputs | Aliased title, subtitle, `center` with `booleanAttribute`; why the class stays small. |
| 02:07-03:07 | Template | Head, `h1`, four slots declared once. |
| 03:08-04:02 | Styles | Tokens by role, `:has`, `respond-to`, `::ng-deep`. |
| 04:03-05:17 | Tests | Setup and four tests; the projection contract. |
| 05:18-05:35 | Pitfalls | Slots in `@if`, a second `h1`, the transform. |
| 05:36-06:09 | Recap | Things to remember; preview of video 03. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/auth-card/*.spec.ts'
npm run storybook          # Components → Auth Card
```

## Pitfalls

- Wrapping several `[slot=…]` nodes in one `@if` on the page (NG8011).
- Adding a second `h1` inside the projected form.
- Dropping `transform: booleanAttribute` from `center`, so the bare attribute stops meaning true.

## References

- [Angular: Content projection with ng-content](https://angular.dev/guide/components/content-projection)
- [Angular: Accepting data with input properties](https://angular.dev/guide/components/inputs)
- [MDN: :has()](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
