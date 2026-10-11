/**
 * WCAG colour maths for computed CSS colours (`rgb(r, g, b)`,
 * `rgba(r, g, b, a)` or `color(srgb r g b / a)`), so specs can state contrast intent without
 * hard-coding a theme's hex values.
 */

function channels(css: string): [number, number, number] {
  const rgb = css.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const [r, g, b] = rgb[1]!.split(",").map((part) => parseFloat(part));
    return [r!, g!, b!];
  }
  // A resolved color-mix() computes to `color(srgb r g b / a)`, 0 to 1.
  const srgb = css.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
  if (srgb) {
    const [r, g, b] = srgb.slice(1, 4).map((part) => parseFloat(part) * 255);
    return [r!, g!, b!];
  }
  throw new Error(`Not an sRGB colour: ${css}`);
}

/** WCAG 2.2 relative luminance, 0 (black) to 1 (white). */
export function luminance(css: string): number {
  const [r, g, b] = channels(css).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

/** WCAG 2.2 contrast ratio between two opaque colours, 1 to 21. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}
