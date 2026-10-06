import type { StoryObj } from '@storybook/angular';

import { brandSaturdaze, createLightTheme } from 'components';
import type { ThemeProvider } from 'components';

// A forest-green ramp: only the steps the alias tokens read need to change.
const forest = createLightTheme({
  ...brandSaturdaze,
  70: '#1f5a44',
  80: '#2d7d5f',
  160: '#deede5',
});

export const Rebrand: StoryObj<ThemeProvider> = {
  render: () => ({
    props: { forest },
    template: `
      <div [sdThemeProvider]="forest" class="sd-stack">
        <sd-button variant="primary">Plan my weekend</sd-button>
        <sd-button variant="text">See past weekends</sd-button>
        <div><sd-chip>Brunch</sd-chip></div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`createLightTheme(brand)` builds a complete theme from a new 16-step ramp; every brand alias (`colorBrandBackground`, `colorBrandForeground2`, `colorStrokeFocus2`, …) follows it.',
      },
    },
  },
};
