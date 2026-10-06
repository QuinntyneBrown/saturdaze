import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const AsLink: StoryObj<Button> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-button href="/create-account">Get started</sd-button>
        <sd-button variant="quiet" href="https://open-meteo.com" target="_blank">Open-Meteo</sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'With `href` the button renders an `<a>`. In-app paths route through the Angular router; `target="_blank"` adds `rel="noopener"`.',
      },
    },
  },
};
