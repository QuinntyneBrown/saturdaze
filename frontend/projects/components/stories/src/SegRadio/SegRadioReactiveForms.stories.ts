import { FormControl, FormGroup } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { SegRadio } from 'components';

export const ReactiveForms: StoryObj<SegRadio> = {
  render: () => {
    const form = new FormGroup({
      description: new FormControl('Pick up the cake', { nonNullable: true }),
      day: new FormControl('either', { nonNullable: true }),
    });
    return {
      props: {
        form,
        days: [
          { value: 'Saturday', label: 'Saturday' },
          { value: 'Sunday', label: 'Sunday' },
          { value: 'either', label: 'Either' },
        ],
      },
      template: `
        <form [formGroup]="form" style="max-width: 360px; display: grid; gap: 16px">
          <sd-text-input label="What's the errand" formControlName="description" />
          <sd-seg-radio label="Which day" [options]="days" formControlName="day" />
          <pre style="margin: 0; font-size: 12px">{{ form.value | json }}</pre>
        </form>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Part of the "Add an errand" form. The control holds the chosen option\'s `value`; "Either" lets the planner pick the day.',
      },
    },
  },
};
