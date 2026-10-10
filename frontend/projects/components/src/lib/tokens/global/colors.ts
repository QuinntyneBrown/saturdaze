import type { ColorVariants } from '../types';

// Global colour palette — raw values only. Themes map these onto alias
// tokens; components never read them directly.

export const white = '#ffffff';

/** Warm neutrals: the cream page and the recessed sand of wells and locked blocks. */
export const cream = '#faf7f2'; // warm cream, like a kitchen mid-morning
export const sand = '#f3efe8';

/** Slate ink, keyed by HSL lightness like Fluent's `grey[14]`. */
export const slate = {
  17: '#1f2937',
  40: '#5b6270', // secondary text: 5.35:1 on wells, 6.13:1 on white (WCAG 1.4.3)
  43: '#636a77', // hint text: 4.75:1 on wells (WCAG 1.4.3)
  53: '#80868f', // control edges: 3.67:1 on white, 3.20:1 on wells (WCAG 1.4.11)
  65: '#9ca3af',
} as const;

/** Slate ink at fixed alphas — hairlines, overlays and shadow colours. */
export const slateAlpha = {
  4: 'rgba(31, 41, 55, 0.04)',
  6: 'rgba(31, 41, 55, 0.06)',
  8: 'rgba(31, 41, 55, 0.08)',
  12: 'rgba(31, 41, 55, 0.12)',
  16: 'rgba(31, 41, 55, 0.16)',
  40: 'rgba(31, 41, 55, 0.4)',
} as const;

/** Forest green — "locked", confirmed. */
export const forest: ColorVariants = {
  shade40: '#2d7d5f',
  primary: '#2d7d5f',
  tint50: '#deede5',
};

/** Terracotta — a gentle warning, not an alarming one. */
export const terracotta: ColorVariants = {
  shade40: '#8f3d27',
  primary: '#c45a3f',
  tint50: '#fadfd6',
};

/** Sunny chip / weather. */
export const sun: ColorVariants = {
  shade40: '#8a6212',
  primary: '#f4c969',
  tint50: '#fbebc4',
};

/** Cool weather chip. */
export const sky: ColorVariants = {
  shade40: '#2c5f7a',
  primary: '#bfd9e8',
  tint50: '#dce9f1',
};

/** Outdoor chip. */
export const leaf: ColorVariants = {
  shade40: '#2d7d5f',
  primary: '#a9c9a4',
  tint50: '#ddeeda',
};

/** Indoor chip. */
export const indoor: ColorVariants = {
  shade40: '#5a3b82',
  primary: '#c9b6e0',
  tint50: '#eadff4',
};
