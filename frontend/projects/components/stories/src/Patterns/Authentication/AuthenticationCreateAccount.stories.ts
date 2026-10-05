import type { StoryObj } from '@storybook/angular';

export const CreateAccount: StoryObj = {
  name: 'Create account',
  render: () => ({
    template: `
      <sd-auth-shell>
        <sd-auth-card title="Start planning weekends" subtitle="It takes a minute.">
          <form class="sd-stack" style="--gap: 14px" (submit)="$event.preventDefault()">
            <sd-text-input label="Family name" name="familyName" autocomplete="off" hint="How we greet you." placeholder="The Browns" />
            <sd-text-input label="Email" type="email" name="email" autocomplete="email" value="quinn@saturdaze" error="That doesn't look like an email address." />
            <div class="sd-stack sd-stack--sm">
              <sd-text-input label="Password" type="password" name="password" autocomplete="new-password" value="weekend" hint="Eight characters or more." />
              <sd-strength level="weak" label="Too short" />
            </div>
            <sd-checkbox name="terms" required [ngModel]="true">
              I agree to the <a class="sd-link" routerLink="/legal">Terms</a> and
              <a class="sd-link" routerLink="/legal" fragment="privacy">Privacy Policy</a>.
            </sd-checkbox>
            <sd-checkbox name="fridayPreview" [ngModel]="false">
              Send me the Friday preview. A draft of the weekend in my inbox at 6pm.
            </sd-checkbox>
            <sd-button variant="primary" size="lg" full type="submit" disabled>Create account</sd-button>
          </form>
          <span slot="alt">Already have one? <a class="sd-link" routerLink="/sign-in">Sign in</a></span>
        </sd-auth-card>
      </sd-auth-shell>
    `,
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      story: { height: '1000px' },
      description: {
        story:
          'Validation in place: the email field shows its own `error` line, the password meter reads weak, and the primary stays disabled until the form is valid and the Terms box is ticked.',
      },
    },
  },
};
