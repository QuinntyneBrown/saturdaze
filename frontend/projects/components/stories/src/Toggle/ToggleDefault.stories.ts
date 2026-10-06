import type { StoryObj } from '@storybook/angular';

import type { Toggle } from 'components';

export const Default: StoryObj<Toggle> = {
  args: {
    label: 'Remember me',
    srLabel: '',
    checked: true,
  },
  render: (args) => ({
    props: args,
    template: `<sd-toggle [label]="label" [srLabel]="srLabel" [checked]="checked" />`,
  }),
};
