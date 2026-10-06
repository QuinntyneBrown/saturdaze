# 40 · Coding sd-sitebar: a public top bar with a host directive

> **Runtime:** ~7.2 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md) (layout tokens)

**Video:** [sitebar.mp4](sitebar.mp4) · [Slides](slides.html) · **Audio:** [sitebar.mp3](sitebar.mp3) · [Transcript](script.md)

## Why this video exists

`sd-sitebar` is the top bar on public pages (landing, legal, shared weekend). It is tiny, one boolean input, but it shows how a component composes shared behaviour through `hostDirectives` (the `Scrolled` directive), how that directive handles a high-frequency browser event with signals outside the zone, and how a host class (`.sitebar--cta`), not a reflected attribute, lets the stylesheet react to an input (ADR-009).

## Learning objectives

By the end, the viewer can:

- Declare a boolean input with `input(false, { transform: booleanAttribute })` and mirror it to a host class with `'[class.sitebar--cta]'`.
- Compose behaviour with `hostDirectives: [Scrolled]`.
- Explain the `Scrolled` directive: `inject()`, `afterNextRender`, `runOutsideAngular`, a signal written only on change, `DestroyRef` cleanup.
- Render a CTA as a link through `sd-button`'s `href`.
- Use layout tokens and a `[data-scrolled]` backdrop with `color-mix`.
- Fake `window.scrollY` in a spec and reset it.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why a host directive rather than code in the bar? | The top bar needs the same behaviour; consumers never have to add it. |
| Why listen outside the zone? | Scroll fires constantly; only a state flip should trigger change detection. |
| Why mirror `cta` to a host class, not an attribute? | `:host(.sitebar--cta) .sitebar__link` hides Sign in below 380px; ADR-009 keeps only classes and ARIA state on the host. |
| Who decides whether the CTA shows? | Route data (`cta: true`) read by the app shell's `siteCta` computed. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/app.html` | `<sd-sitebar [cta]="siteCta()" />` in the site shell. |
| `frontend/projects/saturdaze/src/app/app.routes.ts` | `shell: 'site'` routes with and without `cta`. |
| `frontend/projects/components/src/lib/sitebar/sitebar.ts` | Decorator, `hostDirectives`, the one input. |
| `frontend/projects/components/src/lib/scrolled/scrolled.ts` | The directive. |
| `frontend/projects/components/src/lib/sitebar/sitebar.html` | Brand link, Sign in, CTA. |
| `frontend/projects/components/src/lib/sitebar/sitebar.scss` | Sticky host, backdrop, layout tokens, small-screen rule. |
| `frontend/projects/components/src/lib/sitebar/sitebar.spec.ts` | Setup and the five tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:21 | Introduction | Coding sd-sitebar. |
| 00:21-00:48 | Usage | Rendered once, by the shell. |
| 00:48-02:00 | Decorator | The decorator; Host directives compose behaviour; A host class, not a reflected attribute. |
| 02:00-02:25 | Input | One input. |
| 02:25-03:25 | Scrolled | The Scrolled directive; Outside the zone, signal on change; High-frequency events. |
| 03:25-04:01 | Template | The template. |
| 04:01-05:08 | Styles | Sticky, with a frosted backdrop; Layout tokens line it up with the page; The host class pays off. |
| 05:08-06:12 | Tests | Spec setup; What each test proves; Faking the scroll. |
| 06:12-06:33 | Pitfalls | Pitfalls. |
| 06:33-07:11 | Recap | Things to remember; Coding sd-skeleton-row. |

## Demo commands

```sh
cd frontend
npx ng test components --watch=false --include='**/sitebar/sitebar.spec.ts'   # run the sitebar spec
npm run storybook                                                              # open the Sitebar stories
```

## Pitfalls

- Adding `sdScrolled` by hand: it is already a host directive.
- Listening to scroll inside the zone, or writing the signal on every event.
- Hiding Sign in on small screens without the hero repeating it.

## References

- [Angular: Directive composition API (hostDirectives)](https://angular.dev/guide/directives/directive-composition-api)
- [Angular: afterNextRender](https://angular.dev/api/core/afterNextRender)
- [MDN: color-mix()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
