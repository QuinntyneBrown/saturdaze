import type { StoryObj } from '@storybook/angular';

import type { Strength } from 'components';

export const Default: StoryObj<Strength> = {
  args: {
    level: 'ok',
    label: 'OK · eight characters or more. Add a capital letter to make it strong.',
  },
  argTypes: {
    level: { control: 'select', options: [null, 'weak', 'ok', 'strong'] },
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 360px">
        <sd-strength [level]="level" [label]="label" />
      </div>
    `,
  }),
};
