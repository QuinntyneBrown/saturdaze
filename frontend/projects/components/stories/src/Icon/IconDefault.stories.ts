import type { StoryObj } from '@storybook/angular';

import type { Icon } from 'components';

export const Default: StoryObj<Icon> = {
  args: {
    name: 'sun',
    size: 24,
    filled: false,
    stroke: 1.7,
  },
  render: (args) => ({
    props: args,
    template: `<sd-icon [name]="name" [size]="size" [filled]="filled" [stroke]="stroke" />`,
  }),
};
