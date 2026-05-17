# ADR-005 — `sd-bottom-nav` must clear iOS Safari chrome and the home indicator

**Status:** Accepted
**Date:** 2026-05-17
**Supersedes:** the partial fix in [BUG-047](../bugs/BUG-047.md)
**Reinforces:** [BUG-049](../bugs/BUG-049.md)

## Context

`sd-bottom-nav` is the primary navigation surface on mobile — a floating pill anchored to the bottom of every signed-in route. It uses `position: fixed` with `bottom: <offset>` so it stays visible while content scrolls.

On iOS Safari, three different things can occupy the bottom edge of the screen and overlap a naïvely-positioned fixed element:

1. **The Safari URL / tab bar.** In iOS 15+ Safari shows its toolbar at the bottom and dynamically expands/collapses it. **Expanded** (the user has scrolled UP, or just landed on the page) it can be 80–150 px tall. **Collapsed** (the user has scrolled DOWN) it shrinks to a 30 px hint or disappears.
2. **The home indicator.** ~34 px tall on Face-ID iPhones; ~0 px on Touch-ID. Represented in CSS by `env(safe-area-inset-bottom)`.
3. **Web-view chrome under `viewport-fit=cover`.** With `viewport-fit=cover` set on the `<meta name="viewport">`, the layout viewport extends edge-to-edge of the screen, including UNDER the Safari toolbar. `position: fixed` elements pinned to the layout viewport's bottom can therefore render *behind* the visible chrome.

The original BUG-047 fix correctly added `env(safe-area-inset-bottom)` and `viewport-fit=cover`. That solved case (2). But case (1) — the *dynamic* Safari toolbar — was not addressed, and the user observed the nav being overlapped again when scrolling up on a real iPhone (BUG-049).

## Decision

The `sd-bottom-nav` component's `:host` rule must position the nav with a `bottom` calc that takes the **larger** of the two bottom-edge obstructions (they are NOT additive — when Safari's chrome is visible it already overlays the home-indicator zone) and adds a fixed visual floor:

```scss
bottom: calc(
  12px                                                          /* visual breathing-room floor */
  + max(env(safe-area-inset-bottom, 0px), 100lvh - 100dvh)      /* whichever obstruction is currently present */
);
```

`100lvh - 100dvh` evaluates to the **current** Safari chrome height in CSS pixels, dynamically as the user scrolls:

| Viewport unit | Definition                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| `lvh`         | "large viewport" — viewport height when browser UI is fully retracted (e.g., Safari chrome fully collapsed) |
| `svh`         | "small viewport" — viewport height when browser UI is fully expanded (worst case)                           |
| `dvh`         | "dynamic viewport" — *current* viewport height, recomputed as UI state changes                              |

| State                                          | `100lvh` | `100dvh` | difference            | `env(safe-area-inset-bottom)` | `max(...)` |
| ---------------------------------------------- | -------- | -------- | --------------------- | ----------------------------- | ---------- |
| Safari chrome fully collapsed (scroll-down)    | viewport | viewport | `0px`                 | `~34px` (Face-ID)             | `34px`     |
| Safari chrome partially shown (mid-scroll)     | larger   | current  | `~30–80px`            | `~34px`                       | ~current chrome |
| Safari chrome fully expanded (scroll-top)      | larger   | smallest | chrome max (`~150px`) | `~34px`                       | chrome max |
| Non-Safari browser, no inset (desktop)         | viewport | viewport | `0px`                 | `0px`                         | `0px`      |
| iOS PWA standalone (no Safari chrome)          | viewport | viewport | `0px`                 | `~34px`                       | `34px`     |

The resulting bottom offset tracks the chrome's actual current state, so the nav sits just 12 px above whatever bottom obstruction is currently visible.

**Important: the second component must be `100lvh - 100dvh`, not `100lvh - 100svh`.** `svh` is the *worst-case* (fully-expanded chrome) viewport, not the current one — using it makes the nav always reserve space for max chrome even when chrome is partially collapsed, producing a "way too high" gap. `dvh` recomputes with the chrome state, so the nav follows correctly. (First-pass mistake corrected the same day; see BUG-049.)

Additional rules:

- **`<meta name="viewport" content="…, viewport-fit=cover">`** MUST remain in `frontend/projects/saturdaze/src/index.html`. Removing it disables `safe-area-inset` resolution.
- **`.sd-frame { padding-bottom: … + env(safe-area-inset-bottom, 0px) }`** in `_global.scss` MUST remain, so scrolled-to-end content cannot hide behind the nav on Face-ID iPhones.
- **A regression test** (`e2e/tests/regression/bottom-nav-clearance.spec.ts`) asserts the three components are present in `bottom-nav.scss`. The test is the cheap, reliable guard — running it before merging any nav-adjacent change catches regressions without needing a real iPhone.

## Consequences

- **The nav is always visible** at every Safari chrome state, on every iPhone form factor, and in PWA standalone mode.
- The expanded-Safari-chrome case (scroll-top) causes the nav to lift ~80 px higher than its baseline position. Some users may perceive this as the nav "floating up" — that is correct. The alternative (sit fixed and let the chrome cover it) is worse.
- The calc is dense by SCSS standards. A long comment above it points at this ADR. The CSS lint test enforces the components.
- The `100lvh` / `100svh` units are required (iOS Safari ≥ 15.4, all evergreen browsers from 2022+). No older-browser fallback — Saturdaze's audience is iOS 17+.
- Anyone proposing to simplify the calc MUST add a verified manual test on a real iPhone with Safari's URL bar in BOTH the expanded and collapsed state before the simplification can ship.

## Alternatives considered and rejected

| Alternative                                                                | Why rejected                                                                                                |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Use the `VisualViewport` JS API to track `visualViewport.height` and update a CSS variable on scroll** | Adds a scroll listener + RAF batching + lifecycle cleanup. CSS-only is simpler and renders without JS. |
| **Anchor via `top: calc(100svh - nav-height - …)` and set `bottom: auto`** | Requires a hardcoded `nav-height` constant or a measured wrapper. The `bottom-with-compensation` formulation doesn't.  |
| **Anchor via `100dvh`** (dynamic viewport — re-resolves on chrome state change) | Recomputes during scroll. On some iOS versions this causes the nav to visibly jitter as the chrome animates. `lvh - svh` is a stable static computation. |
| **Move the nav into the scrolled content with `position: sticky; bottom: 0`** | Doesn't actually pin to the visible viewport — sticky elements stop at their containing block's edge, not the screen's. The floating pill effect is lost.   |
| **Just add more `bottom` padding** (e.g. `bottom: 90px`)                    | Wastes vertical space when chrome is collapsed. Looks broken on non-iOS browsers.                          |

## Verification

- **Static**: `e2e/tests/regression/bottom-nav-clearance.spec.ts` parses the SCSS source and asserts the calc contains all three components.
- **Manual**: open `/weekend` on iPhone Safari, scroll to top — the nav must be fully visible above the URL bar. Scroll down — the URL bar collapses and the nav settles into its baseline 12px position (with ~34px home-indicator inset below).
