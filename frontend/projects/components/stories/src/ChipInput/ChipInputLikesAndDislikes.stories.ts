import { FormControl, FormGroup } from '@angular/forms';
import type { StoryObj } from '@storybook/angular';

import type { ChipInput } from 'components';

export const LikesAndDislikes: StoryObj<ChipInput> = {
  render: () => {
    const form = new FormGroup({
      likes: new FormControl(['Parks', 'Pancakes', 'Splash pads'], { nonNullable: true }),
      dislikes: new FormControl(['Camping', 'Long drives'], { nonNullable: true }),
    });
    return {
      props: { form },
      template: `
        <form [formGroup]="form" style="max-width: 420px; display: grid; gap: 16px">
          <sd-chip-input label="Likes" tone="leaf" formControlName="likes" />
          <sd-chip-input label="Dislikes" tone="warn" formControlName="dislikes" />
          <pre style="margin: 0; font-size: 12px">{{ form.value | json }}</pre>
        </form>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'The likes dialog: `leaf` chips for likes, `warn` chips for dislikes. Type and press Enter or comma to add; adding "parks" again is ignored because duplicates are matched case-insensitively.',
      },
    },
  },
};
