import type { StoryObj } from '@storybook/angular';

import type { BottomNav } from 'components';

export const Default: StoryObj<BottomNav> = {
  args: {
    active: 'weekend',
  },
  argTypes: {
    active: { control: 'select', options: [null, 'weekend', 'ideas', 'past', 'family'] },
  },
  render: (args) => ({
    props: args,
    template: `<sd-bottom-nav [active]="active" />`,
  }),
  globals: { viewport: { value: 'mobile' } },
};
