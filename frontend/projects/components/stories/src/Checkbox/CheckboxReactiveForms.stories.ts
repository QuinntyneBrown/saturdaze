import { FormControl, FormGroup, Validators } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Checkbox } from 'components';

export const ReactiveForms: StoryObj<Checkbox> = {
  render: () => {
    const form = new FormGroup({
      terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
      fridayPreview: new FormControl(true, { nonNullable: true }),
    });
    return {
      props: { form },
      template: `
        <form [formGroup]="form" style="max-width: 420px; display: grid; gap: 12px">
          <sd-checkbox name="terms" required formControlName="terms">
            I agree to the <a class="sd-link" routerLink="/legal">Terms</a> and
            <a class="sd-link" routerLink="/legal" fragment="privacy">Privacy Policy</a>.
          </sd-checkbox>
          <sd-checkbox name="fridayPreview" formControlName="fridayPreview">
            Send me the Friday preview. A draft of the weekend in my inbox at 6pm.
          </sd-checkbox>
          <sd-button variant="primary" full type="button" [disabled]="form.invalid">Create account</sd-button>
          <pre style="margin: 0; font-size: 12px">{{ form.value | json }} · {{ form.status }}</pre>
        </form>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'The end of the Create account form: the terms consent gates the submit button; the Friday preview opt-in starts ticked.',
      },
    },
  },
};
