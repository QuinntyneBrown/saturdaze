import { Router } from '@angular/router';

/**
 * Anchors that carry a real `href` (so copy-link, middle-click and direct
 * opens keep their browser meaning) but should still navigate inside the
 * SPA on a plain primary click.
 */
export function isPlainClick(event: MouseEvent): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  return true;
}

/** Absolute, same-origin, in-app paths only (`/weekend`, `/ideas/food`). */
export function isInAppHref(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

/**
 * Intercepts a plain click on an in-app href and routes it through the
 * Angular router. External, hash-only and modifier clicks fall through.
 */
export function navigateInApp(router: Router, event: MouseEvent, href: string): void {
  if (!isPlainClick(event) || !isInAppHref(href)) return;
  event.preventDefault();
  void router.navigateByUrl(href);
}
