import type { ColorVariants, DarkColorVariants } from '../types';

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
  72: 'rgba(31, 41, 55, 0.72)',
} as const;

/** White at fixed alphas — highlights over fills. */
export const whiteAlpha = {
  60: 'rgba(255, 255, 255, 0.6)',
} as const;

/** Forest green — "locked", confirmed. */
export const forest: ColorVariants = {
  shade40: '#256b51', // text on its tint: 5.25:1 (WCAG 1.4.3); #2d7d5f stays the solid fill
  primary: '#2d7d5f',
  tint50: '#deede5',
};

/** Terracotta — a gentle warning, not an alarming one. */
export const terracotta: ColorVariants = {
  shade40: '#8f3d27',
  primary: '#ae2b2b', // brick-red danger fill: white 6.60:1 (WCAG 1.4.3), redder than the brand coral
  tint50: '#fadfd6',
};

/** Sunny chip / weather. */
export const sun: ColorVariants = {
  shade40: '#8a6212',
  shade20: '#b07f14', // filled rating star: 3.56:1 on white (WCAG 1.4.11)
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
  shade40: '#256b51', // forest text on the leaf tint: 5.25:1 (WCAG 1.4.3)
  primary: '#a9c9a4',
  tint50: '#ddeeda',
};

/** Indoor chip. */
export const indoor: ColorVariants = {
  shade40: '#5a3b82',
  primary: '#c9b6e0',
  tint50: '#eadff4',
};

// ---------------------------------------------------------------- dark theme
// The design system's dark theme (docs/design-system/tokens/tokens.css):
// built from the same roles as light, not inverted from it.

/** Warm umber neutrals: surfaces that lighten as they rise, and the light inks on them. */
export const umber = {
  50: '#f2ede6', // body ink; the inverted fill
  200: '#cdc4b8', // secondary text: 10.7:1 on the page
  300: '#aea597', // hints: 5.5:1 on wells
  400: '#8f867b', // control edges: 3.7:1 on wells (WCAG 1.4.11)
  600: '#6e665d', // disabled; never live text
  750: '#342e28', // recessed wells, locked blocks
  850: '#201c18', // cards, dialogs, inputs
  900: '#161310', // the page
} as const;

/** Umber ink at fixed alphas — hairlines on dark surfaces. */
export const umberAlpha = {
  10: 'rgba(242, 237, 230, 0.1)',
  18: 'rgba(242, 237, 230, 0.18)',
} as const;

/** Black at fixed alphas — dark-theme overlays and shadow colours. */
export const blackAlpha = {
  30: 'rgba(0, 0, 0, 0.3)',
  40: 'rgba(0, 0, 0, 0.4)',
  55: 'rgba(0, 0, 0, 0.55)',
  60: 'rgba(0, 0, 0, 0.6)',
  72: 'rgba(0, 0, 0, 0.72)',
} as const;

/** White at a faint alpha — the skeleton's highlight on umber. */
export const whiteAlphaFaint = 'rgba(255, 255, 255, 0.06)';

/**
 * Coral steps the dark theme needs beyond the brand ramp: a lighter fill
 * (300) and text (200) that read on umber, and the deep tints (900, 950).
 */
export const coralDark = {
  200: '#f6cbb9', // brand text and the fill's hover
  300: '#f59c7c', // the primary fill, the focus ring: 950 label 8.1:1
  900: '#43251a', // the soft brand fill
  950: '#2a160e', // the label on the fill
} as const;

/** Forest, terracotta and the four tones on umber: a deep tint, a light ink and solid fill. */
export const forestDark: DarkColorVariants = {
  tint: '#1a3629',
  ink: '#7cc4a0',
  primary: '#7cc4a0',
  onPrimary: '#0c2219',
};
export const terracottaDark: DarkColorVariants = {
  tint: '#44201a',
  ink: '#ffa19b',
  primary: '#ff8f8a',
  onPrimary: '#2a0f09',
};
export const sunDark: DarkColorVariants = { tint: '#3a2d14', ink: '#f4cf7a', primary: '#f4c969' };
export const skyDark: DarkColorVariants = { tint: '#1b3140', ink: '#9ccbe4', primary: '#9ccbe4' };
export const leafDark: DarkColorVariants = { tint: '#1f3522', ink: '#a6d8a0', primary: '#a6d8a0' };
export const indoorDark: DarkColorVariants = {
  tint: '#2f2545',
  ink: '#cdb8ee',
  primary: '#cdb8ee',
};
