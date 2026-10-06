# 07 · Coding sd-bottom-nav: a navigation landmark and a protected offset

> **Runtime:** ~7.5 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [03 · sd-auth-shell](../auth-shell/README.md); read `docs/adr/ADR-005-bottom-nav-device-chrome-clearance.md` alongside

**Video:** [bottom-nav.mp4](bottom-nav.mp4) · [Slides](slides.html) · **Audio:** [bottom-nav.mp3](bottom-nav.mp3) · [Transcript](script.md)

## Why this video exists

`sd-bottom-nav` is the phone navigation pill (Weekend, Ideas, Past, Family), rendered once by the app shell below 720px. The component itself is small; its stylesheet carries the ADR-005 bottom offset that must clear both the iPhone home indicator and Safari's dynamic toolbar. This video builds the component and explains why that line must not be simplified.

## Learning objectives

By the end, the viewer can:

- Make the host the navigation landmark (`role="navigation"`, `aria-label="Primary"`).
- Type a nullable input with a union (`NavKey | null`) and surface it as `aria-current`, not as a reflected host attribute (ADR-009).
- Explain why the shared `NAV_ITEMS` constant is a plain field, not a signal.
- Render links with `@for … track item.key`, `routerLink` and `aria-current="page"`.
- Explain the ADR-005 `bottom: calc(12px + max(env(safe-area-inset-bottom, 0px), var(--sd-chrome-bottom, 0px)))` rule and the `trackBottomChrome()` hook in `main.ts`.
- Style the active item from `[aria-current='page']`.
- Explain what each test in `bottom-nav.spec.ts` proves, and which e2e regression spec guards the offset.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why `max()` and not addition? | When Safari's toolbar is visible it already covers the home-indicator zone; adding floats the nav too high. |
| Why JavaScript for `--sd-chrome-bottom`? | No CSS unit isolates the bottom chrome; `VisualViewport` can (ADR-005). |
| Why style `aria-current` instead of an active class? | Visual and accessible state can't drift apart, and the mocks use the same attribute. |
| Why not a signal for the items? | They never change at runtime; the same constant feeds `sd-top-bar`. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/app.html` | The shell renders the nav once for `shell() === 'app'`. |
| `frontend/projects/components/src/lib/bottom-nav/bottom-nav.ts` | Host landmark, `active`, `items`. |
| `frontend/projects/components/src/lib/shared/nav-key.ts` | `NavKey` and `NAV_ITEMS`. |
| `frontend/projects/components/src/lib/bottom-nav/bottom-nav.html` | `@for`, `routerLink`, `aria-current`. |
| `docs/mocks/pages/weekend.html` | The mock's `bottom-nav__item` with `aria-current="page"`. |
| `frontend/projects/components/src/lib/bottom-nav/bottom-nav.scss` | The ADR-005 offset, active styles, tablet hide. |
| `frontend/projects/saturdaze/src/main.ts` | `trackBottomChrome()`. |
| `docs/adr/ADR-005-bottom-nav-device-chrome-clearance.md` | The four failed CSS attempts. |
| `frontend/projects/components/src/lib/bottom-nav/bottom-nav.spec.ts` | Four tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:38 | Introduction | Four destinations; rendered once by the shell. |
| 00:39-01:34 | Decorator | Navigation landmark on the host; `active` stays an input. |
| 01:35-02:33 | Input | `NavKey | null`; shared constant items. |
| 02:34-03:17 | Template | `@for` by key, `routerLink`, `aria-current`, parity with the mock. |
| 03:18-04:38 | ADR-005 | The bottom offset, `trackBottomChrome()`, the failed attempts, the regression spec. |
| 04:39-05:22 | Styles | Tokens by role, `aria-current` styling, tablet hide. |
| 05:23-06:34 | Tests | Setup with `provideRouter`; four tests. |
| 06:35-06:52 | Pitfalls | The calc, active classes, per-page navs, signals. |
| 06:53-07:28 | Recap | Things to remember; preview of video 08. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/bottom-nav/*.spec.ts'
cd ../e2e
npx playwright test tests/regression/bottom-nav-clearance.spec.ts --project=mobile
```

## Pitfalls

- Simplifying the `bottom` calc or adding the two insets together (ADR-005).
- Adding a separate active class instead of styling `aria-current`.
- Rendering the nav per page instead of once in the shell.
- Wrapping the constant items in a signal.

## References

- [MDN: env() and safe-area-inset-bottom](https://developer.mozilla.org/en-US/docs/Web/CSS/env)
- [MDN: VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)
- [MDN: aria-current](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current)
- `docs/adr/ADR-005-bottom-nav-device-chrome-clearance.md`, `docs/adr/ADR-009-v2-responsive-shell.md`
