import type { StoryObj } from '@storybook/angular';

import type { AuthCard } from 'components';

export const WithError: StoryObj<AuthCard> = {
  render: () => ({
    template: `
      <div style="max-width: 440px">
        <sd-auth-card title="Welcome back" subtitle="Sign in to see this weekend.">
          <sd-banner tone="warn" role="alert" icon="close">That email and password did not match.</sd-banner>
          <form class="sd-stack" style="--gap: 14px" (submit)="$event.preventDefault()">
            <sd-text-input label="Email" type="email" name="email" value="quinn@saturdaze.app" invalid />
            <sd-text-input label="Password" type="password" name="password" invalid />
            <sd-button variant="primary" size="lg" full type="submit">Sign in</sd-button>
          </form>
          <span slot="alt">New here? <a class="sd-link" routerLink="/create-account">Create an account</a></span>
        </sd-auth-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A failed sign-in: a warn banner with `role="alert"` above the form and both fields `invalid` (`aria-invalid="true"`).',
      },
    },
  },
};
