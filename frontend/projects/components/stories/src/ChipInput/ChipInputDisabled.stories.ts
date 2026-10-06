import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { ChipInput } from 'components';

export const Disabled: StoryObj<ChipInput> = {
  render: () => ({
    props: { likes: new FormControl({ value: ['Parks', 'Pancakes'], disabled: true }) },
    template: `
      <div style="max-width: 420px">
        <sd-chip-input label="Likes" tone="leaf" [formControl]="likes" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Disabling the control disables the input and makes the chips' remove buttons do nothing.",
      },
    },
  },
};
