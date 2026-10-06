import type { StoryObj } from '@storybook/angular';

import type { Sitebar } from 'components';

export const WithCta: StoryObj<Sitebar> = {
  render: () => ({
    template: `<sd-sitebar cta />`,
  }),
  parameters: {
    docs: {
      description: { story: '`cta` adds the small primary "Create your account" button (landing, shared weekend).' },
    },
  },
};
