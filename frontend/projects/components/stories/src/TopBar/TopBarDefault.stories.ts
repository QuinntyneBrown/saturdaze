import type { StoryObj } from '@storybook/angular';

import type { TopBar } from 'components';

export const Default: StoryObj<TopBar> = {
  args: {
    active: 'weekend',
    email: 'quinn@saturdaze.app',
  },
  argTypes: {
    active: { control: 'select', options: [null, 'weekend', 'ideas', 'past', 'family'] },
    accountClick: { action: 'accountClick' },
  },
  render: (args) => ({
    props: args,
    template: `<sd-top-bar [active]="active" [email]="email" (accountClick)="accountClick($event)" />`,
  }),
  globals: { viewport: { value: 'desktop' } },
};
