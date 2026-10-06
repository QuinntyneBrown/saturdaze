import type { StoryObj } from '@storybook/angular';

import type { AuthShell } from 'components';

export const Stack: StoryObj<AuthShell> = {
  render: () => ({
    template: `
      <sd-auth-shell stack>
        <sd-auth-card title="Check your email" subtitle="We sent a link to quinn@saturdaze.app." center>
          <sd-disc slot="disc" icon="mail" tone="primary" size="xl" />
          <sd-button variant="quiet" size="lg" full><sd-icon name="refresh" />Resend</sd-button>
        </sd-auth-card>
        <sd-auth-card title="You are verified" subtitle="Tell us about your family and the first weekend follows." center>
          <sd-disc slot="disc" icon="check" tone="accent" size="xl" />
          <sd-button variant="primary" size="lg" full href="/family"><sd-icon name="user" />Set up your family</sd-button>
        </sd-auth-card>
      </sd-auth-shell>
    `,
  }),
  parameters: {
    docs: {
      story: { height: '900px' },
      description: {
        story:
          '`stack` top-aligns the column (`.auth--stack`) so several cards read top-down instead of centring.',
      },
    },
  },
};
