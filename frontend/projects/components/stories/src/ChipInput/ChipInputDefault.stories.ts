import { FormControl } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { ChipInput } from 'components';

export const Default: StoryObj<ChipInput> = {
  args: {
    label: 'Likes',
    tone: 'leaf',
    placeholder: 'Add one, press Enter',
  },
  argTypes: {
    tone: { control: 'select', options: ['default', 'sun', 'sky', 'leaf', 'indoor', 'accent', 'primary', 'warn', 'ink'] },
  },
  render: (args) => ({
    props: { ...args, likes: new FormControl(['Parks', 'Pancakes', 'Museums']) },
    template: `
      <div style="max-width: 420px">
        <sd-chip-input [label]="label" [tone]="tone" [placeholder]="placeholder" [formControl]="likes" />
      </div>
    `,
  }),
};
