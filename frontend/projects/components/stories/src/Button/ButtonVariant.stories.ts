import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const Variant: StoryObj<Button> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-button variant="primary">Primary</sd-button>
        <sd-button variant="quiet">Quiet</sd-button>
        <sd-button variant="ghost">Ghost</sd-button>
        <sd-button variant="danger">Danger</sd-button>
        <sd-button variant="text">Text</sd-button>
        <sd-button variant="quiet" warnText>Sign out</sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "`primary` is the one coral call to action per screen. `quiet` is the default secondary, `ghost` sits on tinted surfaces, `danger` confirms destructive work and `text` is an inline action. `warnText` colours a quiet button's label (Sign out).",
      },
    },
  },
};
