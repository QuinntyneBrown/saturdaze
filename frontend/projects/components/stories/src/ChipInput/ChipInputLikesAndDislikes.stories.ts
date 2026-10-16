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
          <sd-chip-input
            label="Likes"
            tone="leaf"
            [otherValues]="form.controls.dislikes.value"
            otherLabel="Dislikes"
            formControlName="likes"
          />
          <sd-chip-input
            label="Dislikes"
            tone="warn"
            [otherValues]="form.controls.likes.value"
            otherLabel="Likes"
            formControlName="dislikes"
          />
          <pre style="margin: 0; font-size: 12px">{{ form.value | json }}</pre>
        </form>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'The likes dialog pairs each list with the other, rejects case-insensitive duplicates without dropping the draft, and announces each result in a visible polite status.',
      },
    },
  },
};
