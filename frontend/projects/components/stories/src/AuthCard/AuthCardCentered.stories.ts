import type { StoryObj } from '@storybook/angular';

import type { AuthCard } from 'components';

export const Centered: StoryObj<AuthCard> = {
  render: () => ({
    template: `
      <div class="sd-grid-2" style="max-width: 920px">
        <sd-auth-card title="Check your email" subtitle="We sent a link to quinn@saturdaze.app. It lasts 24 hours." center>
          <sd-disc slot="disc" icon="mail" tone="primary" size="xl" />
          <sd-button variant="quiet" size="lg" full><sd-icon name="refresh" />Resend</sd-button>
          <sd-button variant="ghost" size="lg" full href="/weekend">Skip to this weekend</sd-button>
        </sd-auth-card>
        <sd-auth-card title="This link has expired" subtitle="Verification links last 24 hours." center>
          <sd-disc slot="disc" icon="key" tone="warn" size="xl" />
          <sd-button variant="primary" size="lg" full><sd-icon name="mail" />Resend verification email</sd-button>
          <sd-button variant="quiet" size="lg" full href="/sign-in">Back to sign in</sd-button>
        </sd-auth-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Status cards: `center` plus an `xl` `sd-disc` in `[slot=disc]` and stacked full-width buttons. No alt line, so it collapses.',
      },
    },
  },
};
