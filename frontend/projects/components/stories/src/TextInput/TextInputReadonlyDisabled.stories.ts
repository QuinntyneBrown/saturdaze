import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { TextInput } from 'components';

export const ReadonlyAndDisabled: StoryObj<TextInput> = {
  render: () => ({
    props: { email: new FormControl({ value: 'quinntynebrown@gmail.com', disabled: true }) },
    template: `
      <div style="max-width: 360px; display: grid; gap: 16px">
        <sd-text-input label="Family name" value="The Browns" readonly hint="Read-only: select and copy, but no editing." />
        <sd-text-input label="Account email" [formControl]="email" hint="Disabled through the FormControl." />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`readonly` keeps the value focusable and selectable. There is no `disabled` input — disable the bound control (`new FormControl({ value, disabled: true })` or `control.disable()`) and `setDisabledState` disables the native input.',
      },
    },
  },
};
