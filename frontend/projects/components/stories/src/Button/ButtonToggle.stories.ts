import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const Toggle: StoryObj<Button> = {
  render: () => {
    const saved = signal(false);
    return {
      props: { saved, toggle: () => saved.update((v) => !v) },
      template: `
        <sd-button variant="quiet" [pressed]="saved()" (click)="toggle()">
          <sd-icon slot="leading" name="heart" [filled]="saved()" />
          {{ saved() ? 'Saved' : 'Save' }}
        </sd-button>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story: '`pressed` mirrors to `aria-pressed` for toggle buttons such as the favourite heart. Leave it `null` on ordinary buttons.',
      },
    },
  },
};
