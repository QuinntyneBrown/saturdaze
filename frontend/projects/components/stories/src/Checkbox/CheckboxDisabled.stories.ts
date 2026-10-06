import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Checkbox } from 'components';

export const Disabled: StoryObj<Checkbox> = {
  render: () => ({
    props: {
      on: new FormControl({ value: true, disabled: true }),
      off: new FormControl({ value: false, disabled: true }),
    },
    template: `
      <div style="max-width: 420px; display: grid; gap: 12px">
        <sd-checkbox [formControl]="on">Send me the Friday preview.</sd-checkbox>
        <sd-checkbox [formControl]="off">Email me when a submitted event is approved.</sd-checkbox>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Disable the bound control (checked or not); `setDisabledState` disables the native checkbox.',
      },
    },
  },
};
