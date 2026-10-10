import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Stars } from 'components';

export const Editable: StoryObj<Stars> = {
  render: () => {
    const rating = signal(0);
    return {
      props: { rating },
      template: `
        <div style="display: grid; gap: 8px; justify-items: start">
          <sd-stars size="lg" editable groupLabel="Rate Saturday" [rating]="rating()" (ratingChange)="rating.set($event)" />
          <p style="font-size: var(--fontSizeBase350); color: var(--colorNeutralForeground2)">
            {{ rating() ? 'You gave Saturday ' + rating() + ' of 5.' : 'Not rated yet.' }}
          </p>
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          '`editable` renders a radiogroup of five buttons. `ratingChange` emits the picked step — bind it back to `rating`. Press the current star again to clear it to 0.',
      },
    },
  },
};
