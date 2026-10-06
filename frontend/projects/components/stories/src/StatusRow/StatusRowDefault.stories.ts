import type { StoryObj } from '@storybook/angular';

import type { StatusRow } from 'components';

export const Default: StoryObj<StatusRow> = {
  args: {
    icon: 'sparkle',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 560px">
        <sd-status-row [icon]="icon">Working through your locks, the forecast and past weekends.</sd-status-row>
      </div>
    `,
  }),
};
