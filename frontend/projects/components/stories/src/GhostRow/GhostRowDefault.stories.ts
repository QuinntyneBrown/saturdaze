import type { StoryObj } from '@storybook/angular';

import type { GhostRow } from 'components';

export const Default: StoryObj<GhostRow> = {
  args: {
    icon: 'plus',
    href: '',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 420px">
        <sd-ghost-row [icon]="icon" [href]="href">Add a commitment</sd-ghost-row>
      </div>
    `,
  }),
};
