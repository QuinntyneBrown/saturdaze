import type { StoryObj } from '@storybook/angular';

export const LinkExpired: StoryObj = {
  name: 'Reset link expired',
  render: () => ({
    template: `
      <sd-auth-shell>
        <sd-auth-card title="This link has expired" subtitle="Reset links last 30 minutes. Ask for a fresh one." center>
          <sd-disc slot="disc" icon="key" tone="warn" size="xl" />
          <sd-button variant="primary" size="lg" full>Send a new link</sd-button>
          <sd-button variant="quiet" size="lg" full href="/sign-in">Back to sign in</sd-button>
        </sd-auth-card>
      </sd-auth-shell>
    `,
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story: 'Recovery error: a warn key disc, the coral primary to start over, and a quiet way back to sign in.',
      },
    },
  },
};
