# 26 · Coding sd-ghost-row: one slot, two elements

> **Runtime:** ~6.8 min · **Audience:** developers who know basic Angular · **Prerequisites:** the `sd-button` video (09) helps; [Consuming tokens](../../05-consuming-tokens/README.md)

**Video:** [ghost-row.mp4](ghost-row.mp4) · [Slides](slides.html) · **Audio:** [ghost-row.mp3](ghost-row.mp3) · [Transcript](script.md)

## Why this video exists

`sd-ghost-row` is the dashed "Add …" row under lists on Family and Weekend. It renders a `<button>` that emits `pressed`, or with `href` an in-app `<a>`. It is the clearest example of the project rule "declare each `ng-content` slot once": the content lives in one `<ng-template>` stamped into either branch with `ngTemplateOutlet`.

## Learning objectives

By the end, the viewer can:

- Render one of two host elements from a signal without losing projected content (`ng-template` + `ngTemplateOutlet`).
- Inject a dependency optionally (`inject(Router, { optional: true })`) so the component works in Storybook and bare tests.
- Use `output<void>()` for the button variant and the shared `navigateInApp` helper for the anchor variant.
- Explain which clicks are routed in-app and which fall through to the browser.
- Read `ghost-row.spec.ts`, including the router spy test.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why one `ng-template` for the content? | Each `ng-content` projects into one place at compile time; repeating it per branch leaves one variant empty. |
| Which clicks does `navigateInApp` intercept? | Plain primary clicks, not prevented, on paths starting with a single `/`. |
| Why is the router optional? | Storybook and isolated tests may have no router. |
| Why `display: contents` on the host? | The inner `.ghost-row` element is the row; the host adds no box. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/pages/family/family.page.html` | Add a family member. |
| `frontend/projects/saturdaze/src/app/pages/weekend/weekend.page.html` | Add an errand. |
| `frontend/projects/components/src/lib/ghost-row/ghost-row.ts` | Decorator, optional router, inputs, output, `onAnchorClick`. |
| `frontend/projects/components/src/lib/shared/in-app-link.ts` | `isPlainClick`, `isInAppHref`, `navigateInApp`. |
| `frontend/projects/components/src/lib/ghost-row/ghost-row.html` | The content template and two branches. |
| `frontend/projects/components/src/lib/ghost-row/ghost-row.scss` | Dashed row, hover media query. |
| `frontend/projects/components/src/lib/ghost-row/ghost-row.spec.ts` | Five tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:31 | Introduction | What it is; usages. |
| 00:31-01:12 | Decorator | Imports, no host object (inputs not reflected, ADR-009), `display: contents`. |
| 01:12-01:57 | Inputs | Optional router, `icon`, `href`, `pressed`. |
| 01:57-02:40 | Navigation | The shared in-app link helper. |
| 02:40-03:53 | Template | One content template, why it matters. |
| 03:53-04:34 | Styles | Dashed row, hover. |
| 04:34-05:45 | Spec | Setup, router test, projection. |
| 05:45-06:09 | Pitfalls | Four mistakes. |
| 06:09-06:45 | Recap | Things to remember; preview of `sd-icon`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/ghost-row/ghost-row.spec.ts'   # run the ghost-row spec
npm run storybook                                                     # GhostRow stories
```

## Pitfalls

- Repeating `ng-content` in each `@if` branch.
- Intercepting modifier clicks or external links.
- Requiring the router.
- Giving the host its own box.

## References

- [Angular: Content projection](https://angular.dev/guide/components/content-projection)
- [Angular: NgTemplateOutlet](https://angular.dev/api/common/NgTemplateOutlet)
- [Angular: inject](https://angular.dev/api/core/inject)
