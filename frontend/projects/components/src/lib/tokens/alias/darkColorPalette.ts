import {
  forestDark,
  indoorDark,
  leafDark,
  skyDark,
  sunDark,
  terracottaDark,
} from '../global/colors';
import type {
  ColorPaletteTokens,
  ColorStatusTokens,
  DarkColorVariants,
  PaletteName,
  StatusName,
} from '../types';

function roles<T extends string>(prefix: T, color: DarkColorVariants) {
  return {
    [`${prefix}Background1`]: color.tint,
    [`${prefix}Background3`]: color.primary,
    [`${prefix}Foreground1`]: color.ink,
    [`${prefix}Foreground3`]: color.primary,
    [`${prefix}Border1`]: color.tint,
    [`${prefix}BorderActive`]: color.primary,
  };
}

const palettes: Record<PaletteName, DarkColorVariants> = {
  Sun: sunDark,
  Sky: skyDark,
  Leaf: leafDark,
  Indoor: indoorDark,
};
const statuses: Record<StatusName, DarkColorVariants> = {
  Success: forestDark,
  Danger: terracottaDark,
};

/** Weather & category tones on umber: a deep tint with a light ink. */
export const darkColorPaletteTokens = Object.assign(
  {},
  ...Object.entries(palettes).map(([name, color]) => roles(`colorPalette${name}`, color)),
) as ColorPaletteTokens;

/** Status tones on umber; the solid fill takes a dark label. */
export const darkColorStatusTokens = Object.assign(
  {},
  ...Object.entries(statuses).map(([name, color]) => ({
    ...roles(`colorStatus${name}`, color),
    [`colorStatus${name}ForegroundInverted`]: color.onPrimary,
  })),
) as ColorStatusTokens;
