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
  12px                                                                         /* visual breathing-room floor */
  + max(env(safe-area-inset-bottom, 0px), var(--sd-chrome-bottom, 0px))        /* whichever bottom obstruction is currently present */
);
```

`--sd-chrome-bottom` is set by a JavaScript `VisualViewport` listener registered in `frontend/projects/saturdaze/src/main.ts` *before* Angular bootstraps. It measures the gap between the visible viewport's bottom edge and the layout viewport's bottom edge — i.e. the **current bottom chrome height in CSS pixels**.

### Why JavaScript, not pure CSS

The previous iterations of this design (see BUG-049) tried four CSS-only formulations:

| Attempt                                          | What broke                                                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `+ env(safe-area-inset-bottom)`                  | Only covered the home indicator, not Safari's dynamic URL bar.                                                              |
| `+ env(...) + max(0, 100lvh - 100svh)`           | Both terms added; nav floated ~46 px above visible bottom even with chrome collapsed.                                       |
| `+ max(env(...), 100lvh - 100svh)`               | `svh` is the worst-case (fully expanded) viewport — nav always reserved max chrome space, looked "way too high" everywhere. |
| `+ max(env(...), 100lvh - 100dvh)`               | On iOS Safari 17+ with `viewport-fit=cover`, `dvh` is the *visible* viewport, which excludes *both* top URL bar *and* bottom toolbar. So `lvh - dvh` is the **combined** top+bottom chrome height (~170–300 px). We only want to clear the bottom; CSS can't distinguish. |

CSS gives us no way to isolate "bottom chrome height" — `dvh` is bidirectional. The DOM `VisualViewport` API does: `visualViewport.offsetTop` is the visible viewport's top in layout coordinates, so `layoutHeight - (offsetTop + height)` is the bottom chrome alone. That's what `trackBottomChrome()` writes into the CSS variable.

### The JS hook (must remain in `main.ts`)

```ts
function trackBottomChrome(): void {
  const vv = window.visualViewport;
  const root = document.documentElement;
  if (!vv) {
    root.style.setProperty('--sd-chrome-bottom', '0px');
    return;
  }
  const update = (): void => {
    const layoutHeight = root.clientHeight;
    const visibleBottom = vv.offsetTop + vv.height;
    const bottomChrome = Math.max(0, layoutHeight - visibleBottom);
    root.style.setProperty('--sd-chrome-bottom', `${bottomChrome}px`);
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  update();
}
trackBottomChrome();
```

Runs before `bootstrapApplication` so the variable is set at the first paint. No Angular dependencies — pure DOM. Performance is negligible (one read + one CSS-variable write per resize/scroll event).

### Resulting offsets

| State                                            | `env(safe-area-inset-bottom)` | `--sd-chrome-bottom` | `max(...)` | `bottom` |
| ------------------------------------------------ | ----------------------------- | -------------------- | ---------- | -------- |
| Desktop Chrome / Firefox / Edge                   | `0`                           | `0`                  | `0`        | `12px`   |
| Face-ID iPhone, PWA standalone (no chrome)        | `~34px`                       | `0`                  | `34px`     | `~46px`  |
| iOS Safari, bottom toolbar collapsed              | `~34px`                       | `0` or small         | `~34px`    | `~46px`  |
| iOS Safari, bottom toolbar partially shown        | `~34px`                       | `~50px`              | `~50px`    | `~62px`  |
| iOS Safari, bottom toolbar fully expanded         | `~34px`                       | `~80px`              | `~80px`    | `~92px`  |

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
| **Pure CSS via `100lvh - 100dvh`** (the earlier accepted decision)         | Tried; fails. `dvh` is the visible viewport excluding BOTH top URL bar and bottom toolbar, so the diff is the combined chrome height. There is no CSS unit that isolates the bottom chrome. (See "Why JavaScript, not pure CSS" above and BUG-049.) |
| **Anchor via `top: calc(100dvh - nav-height - …)` and set `bottom: auto`** | Requires a hardcoded `nav-height` constant or a measured wrapper. Doesn't solve the top-vs-bottom distinction either — same diff problem. |
| **Move the nav into the scrolled content with `position: sticky; bottom: 0`** | Doesn't actually pin to the visible viewport — sticky elements stop at their containing block's edge, not the screen's. The floating pill effect is lost.   |
| **Just add more `bottom` padding** (e.g. `bottom: 90px`)                    | Wastes vertical space when chrome is collapsed. Looks broken on non-iOS browsers.                          |

## Verification

- **Static**: `e2e/tests/regression/bottom-nav-clearance.spec.ts` parses both the SCSS and the `main.ts` source and asserts:
  - `bottom-nav.scss` references `env(safe-area-inset-bottom)` and `var(--sd-chrome-bottom)`.
  - `main.ts` calls `trackBottomChrome()` and writes `--sd-chrome-bottom`.
  - `index.html` keeps `viewport-fit=cover`.
  - `.sd-frame` reserves bottom-padding that includes the safe-area inset.
- **Manual**: open `/weekend` on iPhone Safari, scroll to top — the nav must be fully visible just above Safari's bottom toolbar. Scroll down — the toolbar collapses, the nav settles a bit lower, still ~12 px above the home indicator. There must be **no large empty gap** between the nav and the bottom toolbar in any state.
