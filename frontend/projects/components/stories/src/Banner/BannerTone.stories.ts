import type { StoryObj } from '@storybook/angular';

import type { Banner } from 'components';

export const Tone: StoryObj<Banner> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 12px; max-width: 420px">
        <sd-banner tone="info" icon="share">This weekend was shared with you and is read-only.</sd-banner>
        <sd-banner tone="success" icon="check">Saved. Saturday is locked in.</sd-banner>
        <sd-banner tone="warn" icon="close" role="alert">We couldn't save your changes. Check your connection and try again.</sd-banner>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`info` (default) for neutral notices, `success` to confirm, `warn` for errors and failures.',
      },
    },
  },
};
