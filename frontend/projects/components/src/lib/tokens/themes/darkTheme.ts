import { brandSaturdaze } from '../global/brandColors';
import type { PartialTheme, Theme, ThemeOverride } from '../types';
import { createDarkTheme } from '../utils/createDarkTheme';
import { saturdazeLightTheme } from './lightTheme';

export const saturdazeDarkTheme: Theme = createDarkTheme(brandSaturdaze);

/**
 * The dark theme as a retune of the light one: only the tokens whose value
 * differs, applied when the reader's system prefers dark (L2-130). There is
 * no in-app switch; the theme follows the system setting.
 */
export const darkSchemeOverride: ThemeOverride = {
  media: '(prefers-color-scheme: dark)',
  tokens: Object.fromEntries(
    Object.entries(saturdazeDarkTheme).filter(
      ([key, value]) => saturdazeLightTheme[key as keyof Theme] !== value,
    ),
  ) as PartialTheme,
};
