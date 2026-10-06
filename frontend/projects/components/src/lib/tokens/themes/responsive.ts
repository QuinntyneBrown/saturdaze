import type { ThemeOverride } from '../types';

/**
 * Responsive retunes, applied on top of any theme in source order. Fluent has
 * no equivalent — Saturdaze's v2 shell (ADR-009) swaps a few tokens per
 * breakpoint instead of branching component styles. Breakpoints match
 * `styles/_breakpoints.scss`.
 */
export const responsiveOverrides: ThemeOverride[] = [
  {
    media: '(min-width: 720px)',
    tokens: { layoutGutter: '24px' },
  },
  {
    media: '(min-width: 1024px)',
    tokens: {
      layoutGutter: '32px',
      fontSizeHero800: '40px',
      fontSizeHero700: '30px',
      fontSizeBase600: '22px',
    },
  },
  {
    // 320-379px phones (iPhone SE class) get display type one step down so
    // headings breathe instead of cramping.
    media: '(max-width: 379px)',
    tokens: {
      fontSizeHero800: '30px',
      fontSizeHero700: '24px',
    },
  },
];
