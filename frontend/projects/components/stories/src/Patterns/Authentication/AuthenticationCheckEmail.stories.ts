import type { StoryObj } from '@storybook/angular';

export const CheckEmail: StoryObj = {
  name: 'Check your email',
  render: () => ({
    template: `
      <sd-auth-shell>
        <sd-auth-card title="Check your email" subtitle="We sent a verification link to quinn@saturdaze.app." center>
          <sd-disc slot="disc" icon="mail" tone="primary" size="xl" />
          <sd-button variant="quiet" size="lg" full><sd-icon name="refresh" />Resend</sd-button>
          <sd-button variant="ghost" size="lg" full href="/weekend">Skip to this weekend</sd-button>
        </sd-auth-card>
      </sd-auth-shell>
    `,
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story: 'A status card after sign-up: centred head with an `xl` mail disc, then stacked quiet and ghost buttons. No form, no alt line.',
      },
    },
  },
};
