import type { StoryObj } from '@storybook/angular';

import type { AdminGate } from 'components';

export const Default: StoryObj<AdminGate> = {
  args: {
    email: 'quinntynebrown@gmail.com',
    familyAppUrl: 'https://saturdaze.example.com/weekend',
  },
  argTypes: {
    signOut: { action: 'signOut' },
  },
  render: (args) => ({
    props: args,
    template: `<sd-admin-gate [email]="email" [familyAppUrl]="familyAppUrl" (signOut)="signOut()" />`,
  }),
};
