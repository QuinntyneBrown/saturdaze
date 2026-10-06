# 03 · Coding sd-auth-shell: a page frame with router links

> **Runtime:** ~6.1 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [02 · sd-auth-card](../auth-card/README.md)

**Video:** [auth-shell.mp4](auth-shell.mp4) · [Slides](slides.html) · **Audio:** [auth-shell.mp3](auth-shell.mp3) · [Transcript](script.md)

## Why this video exists

`sd-auth-shell` is the whole page on the signed-out (`bare` shell) routes: brand lockup, the projected auth cards and a Terms · Privacy · Back footer. With one input it shows two reusable patterns: `routerLink` inside a library component (and `provideRouter` in its spec), and turning a boolean input into a host modifier class without reflecting it as an attribute (ADR-009).

## Learning objectives

By the end, the viewer can:

- Write a standalone, OnPush component whose host is the mock's `.auth` page block.
- Bind one `booleanAttribute` input to `[class.auth--stack]`, and explain why it is not reflected as an attribute.
- Explain why signal-reading host bindings need no setter, `@HostBinding` or `computed()`.
- Use `routerLink` and `fragment` for in-app links and hide decorative marks and separators with `aria-hidden`.
- Centre a column with `place-items`, `100svh` and the `--layoutGutter` token.
- Explain what each test in `auth-shell.spec.ts` proves, including why it provides the router.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| What does `stack` change? | `place-items: start center` and more top padding, for several stacked cards. |
| Why `routerLink` instead of `href`? | SPA navigation without a full reload; the anchor still renders a real `href`. |
| Why `provideRouter([])` in the spec? | `routerLink` needs the router to resolve and render hrefs. |
| What do screen readers hear in the footer? | Three links; the `·` separators are `aria-hidden`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/sign-in/sign-in.page.html` | Shell wrapping an auth card. |
| `frontend/projects/components/src/lib/auth-shell/auth-shell.ts` | Decorator, host class binding, `stack`. |
| `frontend/projects/components/src/lib/auth-shell/auth-shell.html` | Brand, default slot, footer links. |
| `frontend/projects/components/src/lib/auth-shell/auth-shell.scss` | Grid host, stack modifier, brand mark. |
| `frontend/projects/components/src/lib/auth-shell/auth-shell.spec.ts` | `provideRouter`, `footLinks`, four tests. |
| `docs/mocks/pages/sign-in.html` | `<main class="auth auth--stack">`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:43 | Introduction | The bare shell and what the auth shell draws. |
| 00:44-01:29 | Decorator | `RouterLink` import, `auth` class, class binding for `stack`, no reflected attribute. |
| 01:30-02:12 | Input | `stack` with `booleanAttribute`; host bindings under OnPush. |
| 02:13-03:15 | Template | Brand, default slot, footer, `routerLink`. |
| 03:16-04:11 | Styles | Grid, `100svh`, layout gutter, brand mark tokens. |
| 04:12-05:14 | Tests | Setup with `provideRouter`; four tests. |
| 05:15-05:33 | Pitfalls | Router in tests, plain hrefs, `aria-hidden`. |
| 05:34-06:06 | Recap | Things to remember; preview of video 04. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/auth-shell/*.spec.ts'
npm run storybook          # Components → Auth Shell
```

## Pitfalls

- Rendering the shell in a test without `provideRouter`.
- Replacing `routerLink` with plain `href`s, which reloads the app on every click.
- Dropping `aria-hidden` from the brand mark or the separator dots.

## References

- [Angular: RouterLink](https://angular.dev/api/router/RouterLink)
- [Angular: Accepting data with input properties](https://angular.dev/guide/components/inputs)
- [MDN: Viewport-percentage lengths (svh)](https://developer.mozilla.org/en-US/docs/Web/CSS/length#relative_length_units_based_on_viewport)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
