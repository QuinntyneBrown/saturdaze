# 19 · Coding sd-dialog: a presentational panel for CDK dialogs

> **Runtime:** ~7.6 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Consuming tokens](../../05-consuming-tokens/README.md); the `sd-button` video (09) helps

**Video:** [dialog.mp4](dialog.mp4) · [Slides](slides.html) · **Audio:** [dialog.mp3](dialog.mp3) · [Transcript](script.md)

## Why this video exists

Every Saturdaze modal is drawn in `sd-dialog`, but the component never opens anything: the Angular CDK `Dialog` service owns the backdrop, focus trap, Escape and the `role="dialog"` container. This video builds the panel step by step from its real source and shows how it cooperates with the CDK, then walks through its spec.

## Learning objectives

By the end, the viewer can:

- Explain the split between CDK `Dialog` (modal behaviour) and `sd-dialog` (the panel).
- Write aliased signal inputs with `booleanAttribute` and derive state with `computed()`.
- Combine an input with an `InjectionToken` (`SD_DIALOG_STATIC`) for subtree-wide configuration.
- Use `output()` and an optional `inject(DialogRef, { optional: true })`.
- Choose `afterNextRender` over `effect()` for one-time DOM work (labelling the container).
- Declare each `ng-content` slot once and style with tokens by role.
- Read and extend `dialog.spec.ts`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Who owns focus, Escape and the backdrop? | The CDK `Dialog` service, opened with `DIALOG_OPTIONS` (`panelClass: 'sd-dialog-panel'`). |
| How does the dialog get an accessible name? | `afterNextRender` sets `aria-labelledby` on the closest `[role="dialog"]`/`[role="alertdialog"]` to the `<h2>` id, unless one exists. |
| Why is `isStatic` a `computed()`? | It merges the `static` input and the `SD_DIALOG_STATIC` token into one derived value. |
| Why is `DialogRef` injected optionally? | The panel also renders inline in Storybook and the `/dialogs` gallery, where there is no ref. |
| Why do primary buttons move on phones? | `order: -1` in the column layout puts the primary action on top; reset from 720px. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/saturdaze/src/app/dialogs/rename-weekend-dialog/rename-weekend-dialog.html` | A real consumer with `slot="actions"` buttons. |
| `frontend/projects/saturdaze/src/app/dialogs/confirm-dialog/confirm-dialog.ts` | `DIALOG_OPTIONS`. |
| `frontend/projects/components/src/lib/dialog/dialog.ts` | Decorator, host bindings, inputs, token, `computed`, `output`, `afterNextRender`, `close()`. |
| `frontend/projects/saturdaze/src/app/pages/dialogs/dialogs.page.ts` | `{ provide: SD_DIALOG_STATIC, useValue: true }`. |
| `frontend/projects/components/src/lib/dialog/dialog.html` | Header, close button, three slots. |
| `frontend/projects/components/src/lib/dialog/dialog.scss` | Panel tokens, action row, `respond-to(tablet)`. |
| `frontend/projects/components/src/lib/dialog/dialog.spec.ts` | Host component, `setInput`, accessibility tests, CDK ref test. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:27 | Introduction | What the panel is; real usages. |
| 00:27-01:04 | The idea | CDK owns modal behaviour; shared options. |
| 01:04-01:52 | Decorator | Selector, standalone, OnPush, host bindings. |
| 01:52-03:03 | Inputs | `inject()`, aliased inputs, `booleanAttribute`, token + `computed()`, `output()`. |
| 03:03-03:47 | Render hook | `afterNextRender` labels the container; `close()`. |
| 03:47-04:24 | Template | Header, close button, slots declared once. |
| 04:24-05:11 | Styles | Tokens by role; action row phone-first, tablet. |
| 05:11-06:31 | Spec | Setup, structure/input/output tests, accessibility, CDK ref. |
| 06:31-06:52 | Pitfalls | Four mistakes to avoid. |
| 06:52-07:38 | Recap | Things to remember; preview of `sd-disc`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/dialog/dialog.spec.ts'   # run the dialog spec
npm run storybook                                               # Dialog stories
```

## Pitfalls

- Making `sd-dialog` open or position itself instead of using CDK `Dialog.open(…, DIALOG_OPTIONS)`.
- Adding `role="dialog"` to the panel (the CDK container already has it).
- Using `effect()` for one-time DOM work.
- Wrapping several `[slot=…]` nodes in one `@if` in a consumer (NG8011).

## References

- [Angular CDK Dialog](https://material.angular.dev/cdk/dialog/overview)
- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- [Angular: afterNextRender](https://angular.dev/api/core/afterNextRender)
- `docs/adr/ADR-009-v2-responsive-shell.md`, `docs/adr/ADR-013-fluent-design-tokens.md`
