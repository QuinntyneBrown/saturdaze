import type { StoryObj } from '@storybook/angular';

import type { Icon } from 'components';

export const Stroke: StoryObj<Icon> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center">
        <sd-icon name="check" [size]="24" [stroke]="1.2" />
        <sd-icon name="check" [size]="24" />
        <sd-icon name="check" [size]="24" [stroke]="2" />
        <sd-icon name="check" [size]="24" [stroke]="2.5" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`stroke` sets the line weight. Keep the default 1.7; chips use 2 at 13px and the chip × uses 2.5 at 10px.',
      },
    },
  },
};
