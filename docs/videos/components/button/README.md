# 09 · Coding sd-button: signals, slots and a tooltip

> **Runtime:** ~8.3 min · **Audience:** developers who know basic Angular and are new to the Saturdaze components library · **Prerequisites:** [04 · sd-avatar](../avatar/README.md) (first `computed()`); [Consuming tokens](../../05-consuming-tokens/README.md) helps

**Video:** [button.mp4](button.mp4) · [Slides](slides.html) · **Audio:** [button.mp3](button.mp3) · [Transcript](script.md)

## Why this video exists

`sd-button` is the one button in the app (more than eighty uses in page and dialog templates). It renders a `<button>` or, with an `href`, an `<a>`; supports five variants, three sizes, icon-only buttons with a tooltip, toggles with `aria-pressed`, and in-app links routed through the SPA. It is the reference implementation of the "declare each `ng-content` slot once" rule.

## Learning objectives

By the end, the viewer can:

- Explain the `display: contents` host and why the inner `.btn` carries the classes and accessible name (ADR-009).
- Declare typed signal inputs, `booleanAttribute` flags, a nullable `pressed`, and a safe `type` default of `button`.
- Derive `classes`, `tooltipText`, `tooltipRelationship` and `rel` with `computed()`.
- Inject the router optionally and route plain in-app anchor clicks with `navigateInApp`.
- Declare the leading, default and trailing slots once in an `<ng-template>` and render it with `ngTemplateOutlet` in both branches.
- Use the `--sd-btn-h` component knob and tokens by role.
- Explain what each test group in `button.spec.ts` proves.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why one `ng-template` for the slots? | Angular projects each node into a single `ng-content`; repeating slots per `@if` branch leaves the anchor empty. |
| When does a tooltip label vs describe? | Icon-only buttons are named by `aria-label` (relationship `label`); text buttons get `aria-describedby`. |
| Why `inject(Router, { optional: true })`? | The button still works where no router is provided (stories, tests). |
| Which clicks are left alone? | External hrefs, `target` set, modifier keys and non-primary buttons. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | "Plan this weekend" primary large button. |
| `frontend/projects/components/src/lib/button/button.ts` | Decorator (no `host` block), inputs, four `computed()`s, `onAnchorClick`. |
| `frontend/projects/components/src/lib/shared/in-app-link.ts` | `navigateInApp`. |
| `frontend/projects/components/src/lib/button/button.html` | The content template and both branches. |
| `frontend/projects/components/src/lib/button/button.scss` | `--sd-btn-h`, variants, the literal `#fff` on danger. |
| `frontend/projects/components/src/lib/button/button.spec.ts` | `click` and `tabTo` helpers; rendering, anchor, projection and tooltip tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:28 | Introduction | The one button; what it supports. |
| 00:29-01:33 | Decorator | Imports, no host block or reflected inputs, `display: contents`. |
| 01:34-02:27 | Inputs | Variants, sizes, `type`, flags, `pressed`, label, tooltip, href. |
| 02:28-03:33 | Computed | `classes`, `tooltipText`, `tooltipRelationship`, `rel`. |
| 03:34-04:14 | Router | Optional `inject(Router)`; disabled anchors; `navigateInApp`. |
| 04:15-05:11 | Template | Slots once in `<ng-template>`; bindings per branch. |
| 05:12-05:50 | Styles | Component knob, tokens by role, disabled state. |
| 05:51-07:19 | Tests | Helpers; rendering, anchor, projection and tooltip groups. |
| 07:20-07:38 | Pitfalls | Slots, labels, `type`, host styling, `noopener`. |
| 07:39-08:16 | Recap | Things to remember; preview of video 10. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/button/*.spec.ts'
npm run storybook          # Components → Button
```

## Pitfalls

- Repeating `<ng-content>` in both the anchor and button branches.
- Shipping an icon-only button without a `label`.
- Defaulting `type` to `submit`.
- Styling the `sd-button` host instead of the inner `.btn`.
- Opening `target="_blank"` without `rel="noopener"`.

## References

- [Angular: Content projection with ng-content](https://angular.dev/guide/components/content-projection)
- [Angular: NgTemplateOutlet](https://angular.dev/api/common/NgTemplateOutlet)
- [Angular: Signals (computed)](https://angular.dev/guide/signals)
- [MDN: aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
