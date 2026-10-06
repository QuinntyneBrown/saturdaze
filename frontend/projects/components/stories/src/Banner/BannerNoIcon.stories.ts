import type { StoryObj } from '@storybook/angular';

import type { Banner } from 'components';

export const NoIcon: StoryObj<Banner> = {
  render: () => ({
    template: `
      <div style="max-width: 420px">
        <sd-banner>Events are refreshed every morning at 6am.</sd-banner>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'Leave `icon` empty (the default) for a text-only strip.' } },
  },
};
