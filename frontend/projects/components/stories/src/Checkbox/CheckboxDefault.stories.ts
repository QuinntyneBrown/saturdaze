import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Checkbox } from 'components';

export const Default: StoryObj<Checkbox> = {
  args: {
    required: false,
    name: 'fridayPreview',
  },
  render: (args) => ({
    props: { ...args, fridayPreview: new FormControl(true) },
    template: `
      <div style="max-width: 420px">
        <sd-checkbox [required]="required" [name]="name" [formControl]="fridayPreview">
          Send me the Friday preview. A draft of the weekend in my inbox at 6pm.
        </sd-checkbox>
      </div>
    `,
  }),
};
