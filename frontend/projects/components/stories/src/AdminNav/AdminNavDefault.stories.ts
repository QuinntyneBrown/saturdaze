import type { StoryObj } from '@storybook/angular';

import type { AdminNav } from 'components';

export const Default: StoryObj<AdminNav> = {
  args: {
    active: 'places',
    email: 'admin@saturdaze.app',
  },
  argTypes: {
    active: {
      control: 'select',
      options: [null, 'health', 'places', 'reviews', 'skips', 'activity'],
    },
    signOut: { action: 'signOut' },
  },
  render: (args) => ({
    props: args,
    template: `<sd-admin-nav [active]="active" [email]="email" (signOut)="signOut()" />`,
  }),
  globals: { viewport: { value: 'desktop' } },
};
