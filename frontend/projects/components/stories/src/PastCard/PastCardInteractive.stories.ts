import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { PastCard } from 'components';

export const Interactive: StoryObj<PastCard> = {
  render: () => {
    const favourite = signal(false);
    const rating = signal<number | null>(3);
    const last = signal('Try the heart, the title, the stars or the buttons.');
    return {
      props: {
        favourite,
        rating,
        last,
        setFavourite: (next: boolean) => favourite.set(next),
        rate: () => {
          rating.update((r) => ((r ?? 0) % 5) + 1);
          last.set('rate: would open the rating dialog');
        },
        say: (text: string) => last.set(text),
      },
      template: `
        <sd-past-card
          style="max-width: 360px"
          title="Stay-home reset"
          dateRange="3 – 4 May 2026"
          highlights="Rained Saturday. Indoor crafts saved it; Sunday hike at Riverwood."
          [rating]="rating()"
          [favourite]="favourite()"
          (favouriteToggle)="setFavourite($event)"
          (rename)="say('rename: would open the rename dialog')"
          (rate)="rate()"
          (remix)="say('remix: plan a new weekend in this spirit')"
          (repeat)="say('repeat: plan this weekend again')"
        />
        <p class="sd-text-sm sd-text-soft sd-mt-4">{{ last() }}</p>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Every control emits and the page owns the state: `favouriteToggle` carries the next value, `rate` (here cycling 1–5 in place of the dialog), `rename`, `remix` and `repeat`.',
      },
    },
  },
};
