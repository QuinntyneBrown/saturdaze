import type { StoryObj } from '@storybook/angular';

import type { Sitebar } from 'components';

export const Xsmall: StoryObj<Sitebar> = {
  name: '320px phone',
  render: () => ({
    template: `<sd-sitebar cta />`,
  }),
  globals: { viewport: { value: 'xsmall' } },
  parameters: {
    docs: {
      description: {
        story: 'Below 380px with `cta`, "Sign in" hides so the wordmark and button fit; the landing hero repeats the sign-in link.',
      },
    },
  },
};
