import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Track the *bottom* chrome height (Safari URL/tab bar at the bottom)
 * and expose it as `--sd-chrome-bottom`. The CSS-only attempt at the
 * same thing (`100lvh - 100dvh`) does not work on real iOS Safari with
 * `viewport-fit=cover`: it measures the combined top+bottom chrome,
 * not just the bottom, so the bottom-nav floats far too high. See
 * ADR-005 and BUG-049 for the path that led here.
 *
 * `VisualViewport` is the only DOM API that distinguishes the visible
 * viewport from the layout viewport. The bottom chrome height is the
 * gap between the visible viewport's bottom edge and the layout
 * viewport's bottom edge.
 */
function trackBottomChrome(): void {
  const vv = window.visualViewport;
  const root = document.documentElement;
  if (!vv) {
    // Non-visual-viewport browser (very old). Fall back to the
    // safe-area inset only (set var to 0 — the CSS max() still picks
    // up env(safe-area-inset-bottom)).
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

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
