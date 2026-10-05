import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { Toggle } from 'components';

export const Disabled: StoryObj<Toggle> = {
  render: () => ({
    props: {
      on: new FormControl({ value: true, disabled: true }),
      off: new FormControl({ value: false, disabled: true }),
    },
    template: `
      <div style="display: grid; gap: 12px">
        <sd-toggle label="Friday preview" [formControl]="on" />
        <sd-toggle label="Keep it cheap" [formControl]="off" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'There is no `disabled` input: disable the bound control; `setDisabledState` disables the switch.',
      },
    },
  },
};
