import { FormControl, Validators } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Checkbox } from 'components';

export const WithLinks: StoryObj<Checkbox> = {
  render: () => ({
    props: { terms: new FormControl(false, Validators.requiredTrue) },
    template: `
      <div style="max-width: 420px">
        <sd-checkbox name="terms" required [formControl]="terms">
          I agree to the <a class="sd-link" routerLink="/legal">Terms</a> and
          <a class="sd-link" routerLink="/legal" fragment="privacy">Privacy Policy</a>.
        </sd-checkbox>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The label is a slot, so it can hold links. `required` sets `aria-required`; the control uses `Validators.requiredTrue` so Create account stays disabled until it is ticked.',
      },
    },
  },
};
