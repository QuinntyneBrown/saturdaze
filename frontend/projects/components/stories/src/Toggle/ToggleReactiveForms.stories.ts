import { FormControl, FormGroup } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Toggle } from 'components';

export const ReactiveForms: StoryObj<Toggle> = {
  render: () => {
    const form = new FormGroup({
      email: new FormControl('quinntynebrown@gmail.com', { nonNullable: true }),
      remember: new FormControl(true, { nonNullable: true }),
    });
    return {
      props: { form },
      template: `
        <form [formGroup]="form" style="max-width: 360px; display: grid; gap: 16px">
          <sd-text-input label="Email" type="email" autocomplete="email" formControlName="email" />
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px">
            <sd-toggle label="Remember me" formControlName="remember" />
            <a class="sd-link" routerLink="/reset-password">Forgot password?</a>
          </div>
          <pre style="margin: 0; font-size: 12px">{{ form.value | json }}</pre>
        </form>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story: 'Sign-in\'s "Remember me": bound with `formControlName`, the control\'s value wins over the static `checked` input.',
      },
    },
  },
};
