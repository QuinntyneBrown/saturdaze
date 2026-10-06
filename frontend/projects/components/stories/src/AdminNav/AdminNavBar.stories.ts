import type { StoryObj } from '@storybook/angular';

import type { AdminNav } from 'components';

/** Below 1024px the side navigation becomes a sticky bar with a link scroller. */
export const Bar: StoryObj<AdminNav> = {
  args: {
    active: 'reviews',
    email: 'admin@saturdaze.app',
  },
  render: (args) => ({
    props: args,
    template: `<sd-admin-nav [active]="active" [email]="email" />`,
  }),
  globals: { viewport: { value: 'mobile1' } },
};
