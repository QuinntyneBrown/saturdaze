# 49 · Coding sdTooltip: a directive, an overlay and a tiny panel

> **Runtime:** ~8.0 min · **Audience:** developers who know basic Angular and want to build components in this library · **Prerequisites:** [Video 09: sd-button](../button/README.md) (the main consumer)

**Video:** [tooltip.mp4](tooltip.mp4) · [Slides](slides.html) · **Audio:** [tooltip.mp3](tooltip.mp3) · [Transcript](script.md)

## Why this video exists

The tooltip is the library's most behaviour-heavy piece: an attribute directive that opens a CDK Overlay, a tiny OnPush panel component, Fluent UI v9 timing rules, and careful accessibility (label vs description). It shows aliased signal inputs, `inject()`, host listeners, one justified `effect()`, and a spec built on fake timers.

## Learning objectives

By the end, the viewer can:

- Split behaviour (directive `[sdTooltip]`) from rendering (`TooltipPanel`, selector `sd-tooltip`).
- Declare aliased signal inputs (`sdTooltip`, `sdTooltipPlacement`, `sdTooltipRelationship`).
- Open a lazily created CDK Overlay with a flexible connected position strategy and a component portal.
- Explain the show delay, hide grace period and warm window, and why touch never shows a tooltip.
- Explain `label` (bubble `aria-hidden`) vs `description` (`aria-describedby`) relationships.
- Test timing with `vi.useFakeTimers()` and helpers for pointer type and `:focus-visible`.

## Key questions

| Question | What a strong answer includes |
| --- | --- |
| Why an overlay? | Positioning, viewport margin, scroll close; never hand-roll floating UI. |
| Why does Escape call `stopPropagation()`? | So one Escape dismisses the hint, not a dialog behind it. |
| Why `detectChanges()` right after attaching? | The description must exist before a screen reader reads focus. |
| Why is `lastHiddenAt` module-level? | The warm window spans every tooltip on the page. |

## Code / assets on screen

| File | What to show |
| --- | --- |
| `frontend/projects/components/src/lib/tooltip/tooltip-panel.ts` | Panel decorator, host bindings, inputs. |
| `frontend/projects/components/src/lib/tooltip/tooltip-panel.scss` | Bubble styles; Fluent tokens by role (`--colorNeutralBackgroundInverted`, `--colorNeutralForegroundInverted`, `--shadow16`). |
| `frontend/projects/components/src/lib/tooltip/tooltip.ts` | Constants, directive, inputs, effect, show/hide. |
| `frontend/projects/components/src/lib/tooltip/tooltip.spec.ts` | Helpers, fake timers, ten tests. |
| `frontend/projects/components/src/lib/button/button.ts` | `tooltipText` and `tooltipRelationship`. |

## Run sheet

| Time | Segment | Content |
| --- | --- | --- |
| 00:00-00:40 | Introduction | Directive + panel; `sd-button` usage. |
| 00:41-01:47 | Panel | Panel component and its styles. |
| 01:48-02:51 | Directive | Timing constants, positions, host listeners. |
| 02:52-03:27 | Inputs | `inject()`, aliased inputs, plain private fields. |
| 03:28-03:54 | Effect | Keeping an open bubble in sync. |
| 03:55-05:33 | Show/hide | Pointer/focus, overlay creation, hide, Escape, relationship. |
| 05:34-07:03 | Spec | Helpers, fake timers, pointer/keyboard/accessibility/text tests. |
| 07:04-07:57 | Recap | Pitfalls, things to remember, preview of `sd-top-bar`. |

## Demo commands

```sh
cd frontend
npx ng test components     # runs the components library specs, tooltip.spec.ts included
npm run storybook          # open Tooltip → Default, Placement, Icon buttons
```

## Pitfalls

- Expecting a tooltip on a disabled trigger (`show()` refuses).
- `description` on an icon-only button: the name is read twice.
- Essential information only in a tooltip: touch users never see it.
- Reaching for a hex value or a mock-era `--sd-*` name in `tooltip-panel.scss`; read Fluent tokens by role (ADR-013).

## References

- [Angular CDK: Overlay](https://material.angular.dev/cdk/overlay/overview)
- [WCAG 2.2: 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html)
- [MDN: ARIA tooltip role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/tooltip_role)
- [Angular: Signal inputs](https://angular.dev/guide/components/inputs)
- `docs/adr/ADR-013-fluent-design-tokens.md`
