import type { StoryObj } from '@storybook/angular';

import type { Spinner } from 'components';

export const WithIcon: StoryObj<Spinner> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center">
        <sd-spinner icon="sparkle" />
        <sd-spinner icon="mail" />
        <sd-spinner icon="fork" />
        <sd-spinner icon="ticket" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'With `icon` the host becomes `.spinner-disc`: a still glyph inside the turning ring — planning, verifying email, finding food, checking events.',
      },
    },
  },
};
