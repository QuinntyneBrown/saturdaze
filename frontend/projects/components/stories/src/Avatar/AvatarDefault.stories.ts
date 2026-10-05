import type { StoryObj } from '@storybook/angular';

import type { Avatar } from 'components';

export const Default: StoryObj<Avatar> = {
  args: {
    name: 'Quinn',
    tone: 'primary',
    size: 'lg',
  },
  render: (args) => ({
    props: args,
    template: `<sd-avatar [name]="name" [tone]="tone" [size]="size" />`,
  }),
};
