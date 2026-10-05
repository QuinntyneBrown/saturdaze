import type { StoryObj } from '@storybook/angular';

export const SignIn: StoryObj = {
  name: 'Sign in',
  render: () => ({
    template: `
      <sd-auth-shell>
        <sd-auth-card title="Welcome back" subtitle="Sign in to see this weekend.">
          <form class="sd-stack" style="--gap: 14px" (submit)="$event.preventDefault()">
            <sd-text-input label="Email" type="email" name="email" autocomplete="email" value="quinn@saturdaze.app" />
            <sd-text-input label="Password" type="password" name="password" autocomplete="current-password" />
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
  globals: { viewport: { value: 'desktop' } },
};
