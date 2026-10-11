import type { ThemeOverride } from '../types';

/**
 * Responsive retunes, applied on top of any theme in source order. Fluent has
 * no equivalent — Saturdaze's v2 shell (ADR-009) swaps a few tokens per
 * breakpoint instead of branching component styles. Breakpoints match
 * `styles/_breakpoints.scss`.
 */
export const responsiveOverrides: ThemeOverride[] = [
  {
    media: '(min-width: 45rem)',
    tokens: { layoutGutter: '24px' },
  },
  {
    media: '(min-width: 64rem)',
    tokens: {
      layoutGutter: '32px',
      fontSizeHero800: '2.5rem',
      fontSizeHero700: '1.875rem',
      fontSizeBase600: '1.375rem',
    },
  },
  {
    // 320-379px phones (iPhone SE class) get display type one step down so
    // headings breathe instead of cramping.
    media: '(max-width: 23.6875rem)',
    tokens: {
      fontSizeHero800: '1.875rem',
      fontSizeHero700: '1.5rem',
    },
  },
];
