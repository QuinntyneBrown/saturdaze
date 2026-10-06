import type { StoryObj } from '@storybook/angular';

import type { PartialTheme, ThemeProvider } from 'components';

const roomier: PartialTheme = {
  borderRadiusCircular: '8px',
  borderRadiusLarge: '4px',
  fontWeightSemibold: '700',
};

export const Default: StoryObj<ThemeProvider> = {
  render: () => ({
    props: { roomier },
    template: `
      <div class="sd-stack">
        <sd-card>
          <p class="sd-text-soft">App theme</p>
          <sd-button variant="primary">Plan my weekend</sd-button>
        </sd-card>
        <sd-card [sdThemeProvider]="roomier">
          <p class="sd-text-soft">Partial override: square radii, bolder labels</p>
          <sd-button variant="primary">Plan my weekend</sd-button>
        </sd-card>
      </div>
    `,
  }),
};
