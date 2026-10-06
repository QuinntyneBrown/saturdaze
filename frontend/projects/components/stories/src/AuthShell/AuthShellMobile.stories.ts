import type { StoryObj } from '@storybook/angular';

import type { AuthShell } from 'components';

export const Mobile: StoryObj<AuthShell> = {
  render: () => ({
    template: `
      <sd-auth-shell>
        <sd-auth-card title="Reset your password" subtitle="Enter your email and we send a link.">
          <form class="sd-stack" style="--gap: 14px" (submit)="$event.preventDefault()">
            <sd-text-input label="Email" type="email" name="email" autocomplete="email" />
            <sd-button variant="primary" size="lg" full type="submit">Send reset link</sd-button>
          </form>
          <a slot="alt" class="sd-link" routerLink="/sign-in">Back to sign in</a>
        </sd-auth-card>
      </sd-auth-shell>
    `,
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: { story: 'On phones the column fills the width inside the page gutter; the card keeps its 24px inner padding.' },
    },
  },
};
