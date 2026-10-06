# 32 · Coding sd-menu: actions, roles and arrow keys

> **Runtime:** ~7.5 min · **Audience:** developers who know basic Angular · **Prerequisites:** [Video 30 · sd-list-item](../list-item/README.md) (in-app links)

**Video:** [menu.mp4](menu.mp4) · [Slides](slides.html) · **Audio:** [menu.mp3](menu.mp3) · [Transcript](script.md)

## Why this video exists

`sd-menu` is the account menu and the Weekend "More" menu, rendered as a CDK Overlay popover from 720px and as a bottom-sheet list below. It shows a data-driven template, a documented `output()` lint suppression, in-app routing and arrow-key focus handled as plain DOM work.

## Learning objectives

By the end, the viewer can:

- Drive a menu from a typed `MenuItem[]` with `@for … track item.id`.
- Declare role, `aria-label`, the sheet class and a `(keydown)` listener in host metadata, without mirroring inputs onto the host (ADR-009).
- Use `inject(Router, { optional: true })` and `inject(ElementRef)`.
- Implement wrapping Arrow Up/Down focus without mirroring focus in signals.
- Walk through the seven tests in `menu.spec.ts`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Who positions the menu? | `MenuOpener` in the app shell: CDK Overlay from 720px, CDK Dialog sheet below. The menu only renders. |
| Why the eslint suppression on `select`? | `no-output-native`: `select` is a DOM event name; renaming the public binding would break consumers. |
| Why is repeated markup OK here but not in `sd-list-item`? | There is no `ng-content`; the declare-once rule is about projection. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/menu/menu.ts` | `MenuItem`, decorator, inputs, `select`, `choose`, `onKey`. |
| `frontend/projects/components/src/lib/menu/menu.html` | Header, `@for`, anchor/button items. |
| `frontend/projects/components/src/lib/menu/menu.scss` | Surface, warn tone, sheet form. |
| `frontend/projects/saturdaze/src/app/shell/menu-opener.ts` | Overlay + `setInput`. |
| `frontend/projects/saturdaze/src/app/dialogs/menu-dialog/menu-dialog.html` | `<sd-menu sheet>`. |
| `frontend/projects/components/src/lib/menu/menu.spec.ts` | Seven tests. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:26 | Introduction | Popover or sheet. |
| 00:27-01:01 | Usage | `MenuOpener`, CDK Dialog and Overlay. |
| 01:02-01:32 | Item type | `MenuItem`. |
| 01:33-02:17 | Decorator | Host role, label, class, keydown; inputs stay inputs. |
| 02:18-03:07 | Inputs | `inject()`, four inputs, `select` and its lint note. |
| 03:08-04:00 | Behaviour | `choose` and `onKey`. |
| 04:01-04:54 | Template | Header, `@for` by id, anchors vs buttons. |
| 04:55-05:25 | Styles | Surface, warn tone, sheet form. |
| 05:26-06:35 | Testing | Setup and the seven tests. |
| 06:36-06:52 | Pitfalls | Hand positioning, missing label, index tracking, swallowed keys. |
| 06:53-07:32 | Recap | Things to remember; next: `sd-page-header`. |

## Demo commands

```sh
cd frontend
npx ng test components --include='**/menu/menu.spec.ts'
npm run storybook   # Menu stories
```

## Pitfalls

- Positioning the popover by hand instead of CDK Overlay.
- Omitting `label` (the menu's accessible name).
- Tracking items by index instead of `id`.
- Preventing default on keys other than the arrows.

## References

- [Angular CDK: Overlay](https://material.angular.dev/cdk/overlay/overview)
- [WAI-ARIA APG: Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
- [Angular: Component host elements](https://angular.dev/guide/components/host-elements)
- [Angular: Custom events with outputs](https://angular.dev/guide/components/outputs)
