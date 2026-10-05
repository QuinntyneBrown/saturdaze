import { FormControl, FormGroup, Validators } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { TextInput } from 'components';

export const ReactiveForms: StoryObj<TextInput> = {
  render: () => {
    const form = new FormGroup({
      email: new FormControl('quinntynebrown@gmail.com', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    });
    return {
      props: { form },
      template: `
        <form [formGroup]="form" style="max-width: 360px; display: grid; gap: 16px">
          <sd-text-input
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            formControlName="email"
            [invalid]="form.controls.email.invalid && form.controls.email.touched"
          />
          <sd-text-input
            label="Password"
            type="password"
            name="password"
            autocomplete="current-password"
            formControlName="password"
            [invalid]="form.controls.password.invalid && form.controls.password.touched"
          />
          <pre style="margin: 0; font-size: 12px">{{ form.value | json }} · {{ form.status }}</pre>
        </form>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'The sign-in form: each field binds with `formControlName`. The control owns the value; a touched, invalid control drives the `invalid` flag.',
      },
    },
  },
};
