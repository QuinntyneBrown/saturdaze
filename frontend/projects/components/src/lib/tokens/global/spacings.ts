import type { HorizontalSpacingTokens, SpacingTokens, VerticalSpacingTokens } from '../types';

// Intentionally not exported! Use horizontalSpacings and verticalSpacings instead.
const spacings: SpacingTokens = {
  none: '0',
  xs: '4px',
  s: '8px',
  m: '12px',
  l: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '32px',
  xxxxl: '40px',
  xxxxxl: '56px',
};

export const horizontalSpacings: HorizontalSpacingTokens = {
  spacingHorizontalNone: spacings.none,
  spacingHorizontalXS: spacings.xs,
  spacingHorizontalS: spacings.s,
  spacingHorizontalM: spacings.m,
  spacingHorizontalL: spacings.l,
  spacingHorizontalXL: spacings.xl,
  spacingHorizontalXXL: spacings.xxl,
  spacingHorizontalXXXL: spacings.xxxl,
  spacingHorizontalXXXXL: spacings.xxxxl,
  spacingHorizontalXXXXXL: spacings.xxxxxl,
};

export const verticalSpacings: VerticalSpacingTokens = {
  spacingVerticalNone: spacings.none,
  spacingVerticalXS: spacings.xs,
  spacingVerticalS: spacings.s,
  spacingVerticalM: spacings.m,
  spacingVerticalL: spacings.l,
  spacingVerticalXL: spacings.xl,
  spacingVerticalXXL: spacings.xxl,
  spacingVerticalXXXL: spacings.xxxl,
  spacingVerticalXXXXL: spacings.xxxxl,
  spacingVerticalXXXXXL: spacings.xxxxxl,
};
