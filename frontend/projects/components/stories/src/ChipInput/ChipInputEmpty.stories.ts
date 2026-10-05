import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { ChipInput } from 'components';

export const Empty: StoryObj<ChipInput> = {
  render: () => ({
    props: { dislikes: new FormControl<string[]>([]) },
    template: `
      <div style="max-width: 420px">
        <sd-chip-input label="Dislikes" tone="warn" placeholder="Camping, long drives…" [formControl]="dislikes" />
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: 'With no values the box shows only the input and its `placeholder`.' } },
  },
};
