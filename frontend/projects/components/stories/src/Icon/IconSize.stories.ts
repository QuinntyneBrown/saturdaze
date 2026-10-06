import type { StoryObj } from '@storybook/angular';

import type { Icon } from 'components';

export const Size: StoryObj<Icon> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center">
        <sd-icon name="calendar" [size]="13" />
        <sd-icon name="calendar" [size]="16" />
        <sd-icon name="calendar" />
        <sd-icon name="calendar" [size]="24" />
        <sd-icon name="calendar" [size]="32" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: '`size` is the square box in pixels (13, 16, 20 default, 24, 32). It is written to the host as `--_size`.' },
    },
  },
};
