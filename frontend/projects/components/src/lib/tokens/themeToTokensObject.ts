import type { Theme } from './types';

/**
 * Programmatically generates a tokens to css variables mapping object from the keys in a theme.
 * Prefer the static {@link tokens} object; this exists for custom themes with extra keys.
 *
 * @param theme - Theme from which to get the keys to generate the tokens to css variables mapping object
 * @returns Tokens to css variables mapping object corresponding to the passed theme
 */
export function themeToTokensObject<TTheme extends Theme>(
  theme: TTheme,
): Record<keyof TTheme, string> {
  const tokens = {} as Record<keyof TTheme, string>;
  const keys = Object.keys(theme) as (keyof TTheme)[];
  for (const key of keys) {
    tokens[key] = `var(--${String(key)})`;
  }
  return tokens;
}
