import { FormControl, FormGroup, Validators } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Dialog } from 'components';

export const Form: StoryObj<Dialog> = {
  render: () => {
    const form = new FormGroup({
      name: new FormControl('Mae', { nonNullable: true, validators: [Validators.required] }),
      age: new FormControl('7', { nonNullable: true }),
    });
    return {
      props: { form },
      template: `
        <sd-dialog static wide title="Edit Mae" subtitle="Ages shape the picks.">
          <form [formGroup]="form" style="display: flex; flex-direction: column; gap: 14px">
            <sd-text-input label="Name" name="memberName" required autocomplete="off" placeholder="First name" formControlName="name"
              [error]="form.controls.name.invalid ? 'Add a name.' : ''" />
            <sd-text-input label="Age" name="memberAge" type="number" [min]="0" [max]="120" placeholder="7" formControlName="age"
              hint="Under 3s get nap-friendly picks." />
          </form>
          <sd-button slot="actions-left" variant="quiet" warnText type="button"><sd-icon name="trash" />Remove</sd-button>
          <sd-button slot="actions" variant="quiet" type="button">Cancel</sd-button>
          <sd-button slot="actions" variant="primary" type="button" [disabled]="form.invalid">Save</sd-button>
        </sd-dialog>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'A form dialog uses `wide` (520px). Fields go in the body; the primary stays disabled until the form is valid. "Remove" goes in `[slot=actions-left]` so from 720px it sits apart on the left. Clear the name to see the error.',
      },
    },
  },
};
