import { darkColorPaletteTokens, darkColorStatusTokens } from '../alias/darkColorPalette';
import { generateDarkColorTokens } from '../alias/darkColor';
import type { BrandVariants, Theme } from '../types';
import { createLightTheme } from './createLightTheme';
import { createShadowTokens } from './shadows';

/**
 * The dark theme (Fluent's `createDarkTheme`): the light theme's type,
 * spacing, shape and motion with the colour and shadow roles re-valued.
 */
export const createDarkTheme: (brand: BrandVariants) => Theme = (brand) => {
  const colorTokens = generateDarkColorTokens(brand);

  return {
    ...createLightTheme(brand),

    ...colorTokens,
    ...darkColorPaletteTokens,
    ...darkColorStatusTokens,

    ...createShadowTokens(
      colorTokens.colorNeutralShadowAmbient,
      colorTokens.colorNeutralShadowKey,
      colorTokens.colorNeutralShadowKeyDarker,
    ),
  };
};
