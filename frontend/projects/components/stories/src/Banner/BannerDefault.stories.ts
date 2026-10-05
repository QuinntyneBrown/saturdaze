import type { StoryObj } from '@storybook/angular';

import type { Banner } from 'components';

export const Default: StoryObj<Banner> = {
  args: {
    tone: 'info',
    icon: 'share',
    role: 'status',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 420px">
        <sd-banner [tone]="tone" [icon]="icon" [role]="role">You're viewing a shared weekend. Sign in to plan your own.</sd-banner>
      </div>
    `,
  }),
};
