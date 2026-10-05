import type { StoryObj } from '@storybook/angular';

import type { Disc } from 'components';

export const Default: StoryObj<Disc> = {
  args: {
    icon: 'fork',
    tone: 'sun',
    size: 'md',
  },
  render: (args) => ({
    props: args,
    template: `<sd-disc [icon]="icon" [tone]="tone" [size]="size" />`,
  }),
};
