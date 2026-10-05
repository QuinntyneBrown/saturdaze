import type { StoryObj } from '@storybook/angular';

import type { AuthCard } from 'components';

export const Default: StoryObj<AuthCard> = {
  args: {
    cardTitle: 'Welcome back',
    subtitle: 'Sign in to see this weekend.',
    center: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 440px">
        <sd-auth-card [title]="cardTitle" [subtitle]="subtitle" [center]="center">
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
      </div>
    `,
  }),
};
