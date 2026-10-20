import type { StoryObj } from '@storybook/angular';

import type { AuthShell } from 'components';

export const Default: StoryObj<AuthShell> = {
  args: {
    stack: false,
    homeHref: '/',
  },
  argTypes: {
    homeHref: {
      control: 'text',
      description:
        'Where the brand and "Back to Saturdaze" lead. The family app passes its marketing site URL (https://www.saturdaze.ca/, ADR-018); \'/\' by default.',
    },
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-auth-shell [stack]="stack" [homeHref]="homeHref">
        <sd-auth-card title="Welcome back" subtitle="Sign in to see this weekend.">
          <form class="sd-stack" style="--gap: 14px" (submit)="$event.preventDefault()">
            <sd-text-input label="Email" type="email" name="email" autocomplete="email" />
            <sd-text-input label="Password" type="password" name="password" autocomplete="current-password" />
            <sd-button variant="primary" size="lg" full type="submit">Sign in</sd-button>
          </form>
          <span slot="alt">New here? <a class="sd-link" routerLink="/create-account">Create an account</a></span>
        </sd-auth-card>
      </sd-auth-shell>
    `,
  }),
};
