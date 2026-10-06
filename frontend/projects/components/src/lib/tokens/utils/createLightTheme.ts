import { colorPaletteTokens, colorStatusTokens } from '../alias/lightColorPalette';
import { generateColorTokens } from '../alias/lightColor';
import {
  borderRadius,
  curves,
  durations,
  fontFamilies,
  fontSizes,
  fontWeights,
  horizontalSpacings,
  layout,
  lineHeights,
  strokeWidths,
  verticalSpacings,
  zIndexes,
} from '../global/index';
import type { BrandVariants, Theme } from '../types';
import { createShadowTokens } from './shadows';

export const createLightTheme: (brand: BrandVariants) => Theme = (brand) => {
  const colorTokens = generateColorTokens(brand);

  return {
    ...borderRadius,
    ...fontSizes,
    ...lineHeights,
    ...fontFamilies,
    ...fontWeights,
    ...strokeWidths,
    ...horizontalSpacings,
    ...verticalSpacings,
    ...durations,
    ...curves,
    ...layout,
    ...zIndexes,

    ...colorTokens,
    ...colorPaletteTokens,
    ...colorStatusTokens,

    ...createShadowTokens(
      colorTokens.colorNeutralShadowAmbient,
      colorTokens.colorNeutralShadowKey,
      colorTokens.colorNeutralShadowKeyDarker,
    ),
  };
};
