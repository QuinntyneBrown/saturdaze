import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Chip } from 'components';

export const Removable: StoryObj<Chip> = {
  render: () => {
    const likes = signal(['Parks', 'Zoo', 'Bike rides', 'Pancakes']);
    return {
      props: {
        likes,
        remove: (like: string) => likes.update((all) => all.filter((l) => l !== like)),
        reset: () => likes.set(['Parks', 'Zoo', 'Bike rides', 'Pancakes']),
      },
      template: `
        <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
          @for (like of likes(); track like) {
            <sd-chip tone="leaf" removable [removeLabel]="'Remove ' + like" (remove)="remove(like)">{{ like }}</sd-chip>
          } @empty {
            <button type="button" style="text-decoration: underline" (click)="reset()">Reset likes</button>
          }
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story: '`removable` adds the × button; it emits `remove` and the page drops the item. Name each × with `removeLabel`.',
      },
    },
  },
};
