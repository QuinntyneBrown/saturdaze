# 50 · Coding sd-top-bar: the sticky desktop navigation

> **Runtime:** ~7.3 min · **Audience:** developers who know basic Angular and want to build components in this library · **Prerequisites:** [Video 35: sd-scrolled](../scrolled/README.md) helps

**Video:** [top-bar.mp4](top-bar.mp4) · [Slides](slides.html) · **Audio:** [top-bar.mp3](top-bar.mp3) · [Transcript](script.md)

## Why this video exists

`sd-top-bar` is the app's desktop navigation, rendered once by the shell. It is the clearest example in the library of `hostDirectives` (the `Scrolled` backdrop), a shared navigation contract (`NAV_ITEMS`), an `output()` that emits an anchor element, and `aria-current` used both for accessibility and styling.

## Learning objectives

By the end, the viewer can:

- Compose behaviour with `hostDirectives: [Scrolled]` and explain how `data-scrolled` reaches the host.
- Drive both navigations from `NAV_ITEMS` / `NavKey` in `shared/nav-key.ts`.
- Derive the avatar initial with `computed()` and emit the anchor element through `output<HTMLElement>()`.
- Render links with `@for … track item.key`, `routerLink` and `aria-current="page"`.
- Hide the bar below 720px with `respond-to(tablet)` instead of TypeScript.
- Test with `provideRouter([])`, `whenStable()`, an output spy and a simulated scroll.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why a host directive? | Shared behaviour (with `sd-sitebar`) by composition, invisible to consumers. |
| Why emit an `HTMLElement`? | The shell anchors the account menu to it (CDK Overlay from 720px). |
| How is the active link styled? | `[aria-current='page']` selector plus `::after` underline. |
| How is the bar hidden on phones? | `:host { display: none }` and `respond-to(tablet)` → `display: block`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/top-bar/top-bar.ts` | Decorator, inputs, output, `computed()`. |
| `frontend/projects/components/src/lib/scrolled/scrolled.ts` | The host directive. |
| `frontend/projects/components/src/lib/shared/nav-key.ts` | `NavKey`, `NAV_ITEMS`. |
| `frontend/projects/components/src/lib/top-bar/top-bar.html` | Brand, nav loop, account button. |
| `frontend/projects/components/src/lib/top-bar/top-bar.scss` | Sticky host, backdrop, `aria-current` styles, breakpoint. |
| `frontend/projects/components/src/lib/top-bar/top-bar.spec.ts` | Router setup and six tests. |
| `frontend/projects/saturdaze/src/app/app.html` | The shell usage. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:37 | Introduction | What the bar is; the shell usage. |
| 00:38-01:43 | Decorator | Imports, `hostDirectives`, host class (no reflected `active`, ADR-009). |
| 01:44-02:56 | API | `NavKey`/`NAV_ITEMS`, inputs, output, `computed()`. |
| 02:57-03:54 | Template | Brand, `@for` links with `aria-current`, account button. |
| 03:55-05:06 | Styles | Sticky host, breakpoint, backdrop, layout tokens, active link. |
| 05:07-06:28 | Spec | Router setup and the six tests. |
| 06:29-07:19 | Recap | Pitfalls, things to remember, preview of `sd-vote-row`. |

## Demo commands

```sh
cd frontend
npx ng test components     # runs the components library specs, top-bar.spec.ts included
npm run storybook          # open TopBar
```

## Pitfalls

- Adding a fifth destination (the four are a fixed contract shared with the bottom nav).
- Toggling visibility in TypeScript instead of the breakpoint mixin.
- Styling the active link with a separate class instead of `aria-current`.

## References

- [Angular: Directive composition API (hostDirectives)](https://angular.dev/guide/directives/directive-composition-api)
- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
- [MDN: aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
