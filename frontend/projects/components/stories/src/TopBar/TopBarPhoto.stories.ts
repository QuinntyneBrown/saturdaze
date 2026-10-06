import type { StoryObj } from '@storybook/angular';

import type { TopBar } from 'components';

export const Photo: StoryObj<TopBar> = {
  args: {
    active: 'family',
    email: 'quinn@saturdaze.app',
    avatarSrc: 'profile-photo.svg',
  },
  render: (args) => ({
    props: args,
    template: `<sd-top-bar [active]="active" [email]="email" [avatarSrc]="avatarSrc" />`,
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'With `avatarSrc` set, the account button shows the profile photo instead of the initial.',
      },
    },
  },
};
