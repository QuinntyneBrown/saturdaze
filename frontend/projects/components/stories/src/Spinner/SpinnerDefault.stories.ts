import type { StoryObj } from '@storybook/angular';

import type { Spinner } from 'components';

export const Default: StoryObj<Spinner> = {
  args: {
    size: 'md',
    icon: '',
  },
  render: (args) => ({
    props: args,
    template: `<sd-spinner [size]="size" [icon]="icon" />`,
  }),
};
