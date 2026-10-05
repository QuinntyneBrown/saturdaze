import type { StoryObj } from '@storybook/angular';

import type { Chip } from 'components';

export const Default: StoryObj<Chip> = {
  args: {
    tone: 'leaf',
    size: 'md',
    count: false,
    removable: false,
    removeLabel: 'Remove',
  },
  render: (args) => ({
    props: args,
    template: `<sd-chip [tone]="tone" [size]="size" [count]="count" [removable]="removable" [removeLabel]="removeLabel">Outdoor</sd-chip>`,
  }),
};
