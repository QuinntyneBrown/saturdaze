import type { StoryObj } from '@storybook/angular';

export const SignInError: StoryObj = {
  name: 'Sign in · wrong password',
  render: () => ({
    template: `
      <sd-auth-shell>
        <sd-auth-card title="Welcome back" subtitle="Sign in to see this weekend.">
          <sd-banner tone="warn" role="alert" icon="close">That email and password did not match.</sd-banner>
          <form class="sd-stack" style="--gap: 14px" (submit)="$event.preventDefault()">
            <sd-text-input label="Email" type="email" name="email" autocomplete="email" value="quinn@saturdaze.app" invalid />
            <sd-text-input label="Password" type="password" name="password" autocomplete="current-password" invalid />
            <div class="sd-cluster sd-cluster--between">
              <sd-toggle label="Remember me" checked />
              <a class="sd-link" routerLink="/reset-password">Forgot password?</a>
            </div>
            <sd-button variant="primary" size="lg" full type="submit">Sign in</sd-button>
          </form>
          <span slot="alt">New here? <a class="sd-link" routerLink="/create-account">Create an account</a></span>
        </sd-auth-card>
      </sd-auth-shell>
    `,
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story:
          'The `sign-in?state=error` state: a warn banner announced as an alert, both fields `invalid`. The banner never says which of the two was wrong.',
      },
    },
  },
};
