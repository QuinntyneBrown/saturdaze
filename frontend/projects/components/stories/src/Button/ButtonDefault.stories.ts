import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const Default: StoryObj<Button> = {
  args: {
    variant: 'primary',
    size: 'md',
    disabled: false,
    full: false,
  },
  render: (args) => ({
    props: args,
    template: `<sd-button [variant]="variant" [size]="size" [disabled]="disabled" [full]="full">Plan my weekend</sd-button>`,
  }),
};
