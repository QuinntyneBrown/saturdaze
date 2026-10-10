import type { PartialTheme, ThemeOverride } from './types';

/** `{ colorBrandBackground: '#bf5130' }` → `{ '--colorBrandBackground': '#bf5130' }`. */
export function themeToCssVariables(theme: PartialTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(theme)) {
    if (value !== undefined) vars[`--${key}`] = value;
  }
  return vars;
}

function block(selector: string, theme: PartialTheme, indent: string): string {
  const body = Object.entries(themeToCssVariables(theme))
    .map(([name, value]) => `${indent}  ${name}: ${value};`)
    .join('\n');
  return `${indent}${selector} {\n${body}\n${indent}}`;
}

/**
 * Serialises a theme to a stylesheet: one rule for the theme itself and one
 * `@media` rule per responsive override. `scripts/generate-tokens.mjs` writes
 * the result to `styles/_tokens.scss`; it is the build-time half of what
 * Fluent's `FluentProvider` does at runtime.
 */
export function themeToCss(
  theme: PartialTheme,
  overrides: ThemeOverride[] = [],
  selector = ':root',
): string {
  return [
    block(selector, theme, ''),
    ...overrides.map((o) => `@media ${o.media} {\n${block(selector, o.tokens, '  ')}\n}`),
  ].join('\n\n');
}
