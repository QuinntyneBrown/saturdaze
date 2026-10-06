import type { StoryObj } from '@storybook/angular';

import type { Sitebar } from 'components';

export const Default: StoryObj<Sitebar> = {
  args: {
    cta: false,
  },
  render: (args) => ({
    props: args,
    template: `<sd-sitebar [cta]="cta" />`,
  }),
};
