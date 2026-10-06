import type {
  FontFamilyTokens,
  FontSizeTokens,
  FontWeightTokens,
  LineHeightTokens,
} from '../types';

/** Sans-serif system stack. Nothing web-loads Inter on purpose. */
export const fontFamilies: FontFamilyTokens = {
  fontFamilyBase:
    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

/** A seven-step scale; `themes/responsive.ts` retunes the display sizes per breakpoint. */
export const fontSizes: FontSizeTokens = {
  fontSizeBase200: '12px',
  fontSizeBase300: '13px',
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
