import { create } from 'storybook/theming';

/**
 * Brands the Storybook manager with the Saturdaze palette. Values mirror
 * `src/lib/styles/_tokens.scss`; the manager runs outside the preview iframe
 * so it cannot read the custom properties. See
 * https://storybook.js.org/docs/configure/user-interface/theming
 */
const theme = create({
  base: 'light',

  colorPrimary: '#E07856', // --sd-primary
  colorSecondary: '#E07856',

  // UI
  appBg: '#FAF7F2', // --sd-bg
  appContentBg: '#FFFFFF', // --sd-surface
  appPreviewBg: '#FAF7F2',
  appBorderColor: 'rgba(31, 41, 55, 0.08)', // --sd-line
  appBorderRadius: 12, // --sd-r-md

  // Fonts — --sd-font-sans
  fontBase:
    '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',

  // Text colors
  textColor: '#1F2937', // --sd-ink
  textMutedColor: '#6B7280', // --sd-ink-soft
  textInverseColor: '#FFFFFF',

  // Toolbar default and active colors
  barTextColor: '#6B7280',
  barSelectedColor: '#E07856',
  barHoverColor: '#A04B2C', // --sd-primary-deep
  barBg: '#FFFFFF',

  // Form colors
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(31, 41, 55, 0.16)', // --sd-line-strong
  inputTextColor: '#1F2937',
  inputBorderRadius: 8, // --sd-r-sm

  brandTitle: 'Saturdaze Design System',
  brandUrl: 'https://github.com/QuinntyneBrown/saturdaze',
  brandImage: './saturdaze-wordmark.svg',
  brandTarget: '_self',
});

export default theme;
