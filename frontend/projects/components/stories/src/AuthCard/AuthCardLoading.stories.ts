import type { StoryObj } from '@storybook/angular';

import type { AuthCard } from 'components';

export const Loading: StoryObj<AuthCard> = {
  render: () => ({
    template: `
      <div style="max-width: 440px">
        <sd-auth-card title="Verifying your email" subtitle="One moment." center>
          <sd-spinner slot="disc" icon="mail" />
          <span class="sd-visually-hidden" role="status" aria-live="polite">Verifying your email</span>
        </sd-auth-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'An `sd-spinner` can take the disc slot while a token is checked; pair it with a visually hidden live status.',
      },
    },
  },
};
