import { FormControl, FormGroup } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Select } from 'components';

export const ReactiveForms: StoryObj<Select> = {
  render: () => {
    const form = new FormGroup({ minutes: new FormControl('45', { nonNullable: true }) });
    return {
      props: {
        form,
        durations: [
          { value: '15', label: '15 min' },
          { value: '30', label: '30 min' },
          { value: '45', label: '45 min' },
          { value: '60', label: '60 min' },
          { value: '90', label: '90 min' },
        ],
      },
      template: `
        <form [formGroup]="form" style="max-width: 360px; display: grid; gap: 12px">
          <sd-select label="Roughly how long" name="minutes" [options]="durations" formControlName="minutes" />
          <pre style="margin: 0; font-size: 12px">{{ form.value | json }}</pre>
        </form>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'The "Add an errand" duration picker. The control holds the selected option\'s `value` string; a change also marks it touched.',
      },
    },
  },
};
