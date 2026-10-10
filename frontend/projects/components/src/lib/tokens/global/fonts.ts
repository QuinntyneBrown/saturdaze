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

/** An eight-step scale (350 is the 14px control-label step); `themes/responsive.ts` retunes the display sizes per breakpoint. */
export const fontSizes: FontSizeTokens = {
  fontSizeBase200: '12px',
  fontSizeBase300: '13px',
  fontSizeBase350: '14px',
  fontSizeBase400: '15px',
  fontSizeBase500: '17px',
  fontSizeBase600: '20px',
  fontSizeHero700: '26px',
  fontSizeHero800: '34px',
};

/** Unitless ratios, so one line height serves every size. */
export const lineHeights: LineHeightTokens = {
  lineHeightTight: '1.2',
  lineHeightSnug: '1.35',
  lineHeightNormal: '1.5',
};

export const fontWeights: FontWeightTokens = {
  fontWeightRegular: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
};
