import { forest, indoor, leaf, sky, sun, terracotta } from '../global/colors';
import type {
  ColorPaletteTokens,
  ColorStatusTokens,
  ColorVariants,
  PaletteName,
  StatusName,
} from '../types';

function roles<T extends string>(prefix: T, color: ColorVariants) {
  return {
    [`${prefix}Background1`]: color.tint50,
    [`${prefix}Background3`]: color.primary,
    [`${prefix}Foreground1`]: color.shade40,
    [`${prefix}Foreground3`]: color.shade20 ?? color.primary,
    [`${prefix}Border1`]: color.tint50,
    [`${prefix}BorderActive`]: color.primary,
  };
}

const palettes: Record<PaletteName, ColorVariants> = {
  Sun: sun,
  Sky: sky,
  Leaf: leaf,
  Indoor: indoor,
};
const statuses: Record<StatusName, ColorVariants> = { Success: forest, Danger: terracotta };

/**
 * Weather & category tones. Always pair `Background1` with `Foreground1` —
 * the ink is chosen to pass AA on the fill.
 */
export const colorPaletteTokens = Object.assign(
  {},
  ...Object.entries(palettes).map(([name, color]) => roles(`colorPalette${name}`, color)),
) as ColorPaletteTokens;

/** Success is "locked / confirmed"; danger is the gentle warning. */
export const colorStatusTokens = Object.assign(
  {},
  ...Object.entries(statuses).map(([name, color]) => roles(`colorStatus${name}`, color)),
) as ColorStatusTokens;
