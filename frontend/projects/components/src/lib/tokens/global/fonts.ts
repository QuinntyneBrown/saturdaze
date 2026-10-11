import type {
  FontFamilyTokens,
  FontSizeTokens,
  FontWeightTokens,
  LineHeightTokens,
} from '../types';

/**
 * Sans-serif system stack (nothing web-loads Inter on purpose), and the
 * monospace stack for codes, URLs and timestamps.
 */
export const fontFamilies: FontFamilyTokens = {
  fontFamilyBase:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

/**
 * An eight-step scale (350 is the 14px control-label step), in rem so text
 * grows with the reader's text size (WCAG 1.4.4): 12 / 13 / 14 / 15 / 17 /
 * 20 / 26 / 34px at the default 16px. `themes/responsive.ts` retunes the
 * display sizes per breakpoint.
 */
export const fontSizes: FontSizeTokens = {
  fontSizeBase200: '0.75rem',
  fontSizeBase300: '0.8125rem',
  fontSizeBase350: '0.875rem',
  fontSizeBase400: '0.9375rem',
  fontSizeBase500: '1.0625rem',
  fontSizeBase600: '1.25rem',
  fontSizeHero700: '1.625rem',
  fontSizeHero800: '2.125rem',
};

/** Unitless ratios, so one line height serves every size; Relaxed is for long-form prose. */
export const lineHeights: LineHeightTokens = {
  lineHeightNone: '1',
  lineHeightTight: '1.2',
  lineHeightSnug: '1.35',
  lineHeightNormal: '1.5',
  lineHeightRelaxed: '1.65',
};

export const fontWeights: FontWeightTokens = {
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
};
