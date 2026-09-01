import { Page } from "@playwright/test";

/**
 * Measurement-based horizontal-overflow detection.
 *
 * `html, body { overflow-x: clip }` (mirrored from the mocks) visually masks
 * any horizontal overflow, and with `clip` (unlike `hidden`) the document's
 * `scrollWidth` does not grow either — so screenshots alone cannot prove
 * nothing is cut off. This sweep walks the rendered tree (including shadow
 * roots, for the mock pages) and reports every element whose *visible*
 * extent sticks out past the viewport's horizontal bounds.
 *
 * Clipping rules during the walk:
 *   - An element with `overflow-x: auto | scroll` is an intentional
 *     scroller (sd-tag-group etc.). Its descendants can always be scrolled
 *     into view, so the subtree is exempt; the scroller itself is judged by
 *     its CONTENT box — the full-bleed pattern (`margin: 0 -20px` matched
 *     by padding) legitimately hangs its padding past the viewport edge.
 *   - An ancestor with `overflow-x: hidden | clip` bounds its subtree —
 *     content it clips is invisible, not viewport overflow.
 *   - The `html`/`body` clip is deliberately IGNORED: it is exactly the
 *     mask this audit exists to see through.
 *
 * An element is an offender when the part of it that no ancestor clips
 * still extends past `[-1, innerWidth + 1]` (1px tolerance for sub-pixel
 * rounding).
 */

export interface OverflowReport {
  viewportWidth: number;
  scrollWidth: number;
  /** Document-level overflow (0 when `overflow-x: clip` suppresses it). */
  documentOverflowPx: number;
  /** Human-readable offender descriptions, capped at 25. */
  offenders: string[];
}

export async function measureHorizontalOverflow(
  page: Page,
): Promise<OverflowReport> {
  return page.evaluate(() => {
    const MAX_OFFENDERS = 25;
    const TOLERANCE = 1;
    const viewportWidth = window.innerWidth;
    const minLeft = -TOLERANCE;
    const maxRight = viewportWidth + TOLERANCE;

    const offenders: string[] = [];
    const seen = new Set<Element>();

    const describe = (el: Element, rect: DOMRect): string => {
      const id = el.id ? `#${el.id}` : "";
      const cls =
        el.classList.length > 0
          ? `.${Array.from(el.classList).slice(0, 3).join(".")}`
          : "";
      return (
        `${el.tagName.toLowerCase()}${id}${cls} ` +
        `[left=${Math.round(rect.left)}, right=${Math.round(rect.right)}, ` +
        `viewport=${viewportWidth}]`
      );
    };

    // clipLeft/clipRight: the horizontal bounds imposed by ancestors that
    // clip or scroll their overflow. Infinite at the root — html/body's
    // own clip is the mask under audit, so it never tightens the bounds.
    const walk = (el: Element, clipLeft: number, clipRight: number): void => {
      if (seen.has(el)) return;
      seen.add(el);

      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const visible =
        rect.width > 0 && rect.height > 0 && style.visibility !== "hidden";
      const overflowX = style.overflowX;
      const isScroller = overflowX === "auto" || overflowX === "scroll";

      if (visible) {
        // A scroller's padding may hang past the viewport by design
        // (full-bleed `margin: 0 -20px` + matching padding); only its
        // content box counts.
        let boxLeft = rect.left;
        let boxRight = rect.right;
        if (isScroller) {
          boxLeft += parseFloat(style.paddingLeft) || 0;
          boxRight -= parseFloat(style.paddingRight) || 0;
        }
        const effectiveLeft = Math.max(boxLeft, clipLeft);
        const effectiveRight = Math.min(boxRight, clipRight);
        if (
          effectiveRight - effectiveLeft > 0 &&
          (effectiveLeft < minLeft || effectiveRight > maxRight) &&
          offenders.length < MAX_OFFENDERS
        ) {
          offenders.push(describe(el, rect));
        }
      }

      // Anything inside a horizontal scroller can be scrolled into view —
      // it can never be viewport cut-off. Skip the subtree.
      if (visible && isScroller) return;

      // Children are bounded by this element's box when it clips them.
      let childClipLeft = clipLeft;
      let childClipRight = clipRight;
      if (visible && (overflowX === "hidden" || overflowX === "clip")) {
        childClipLeft = Math.max(childClipLeft, rect.left);
        childClipRight = Math.min(childClipRight, rect.right);
      }

      const shadow = (el as HTMLElement).shadowRoot;
      if (shadow) {
        for (const child of Array.from(shadow.children)) {
          walk(child, childClipLeft, childClipRight);
        }
      }
      for (const child of Array.from(el.children)) {
        walk(child, childClipLeft, childClipRight);
      }
    };

    for (const child of Array.from(document.body.children)) {
      walk(child, -Infinity, Infinity);
    }

    const scrollWidth = document.documentElement.scrollWidth;
    return {
      viewportWidth,
      scrollWidth,
      documentOverflowPx: Math.max(0, scrollWidth - viewportWidth),
      offenders,
    };
  });
}
