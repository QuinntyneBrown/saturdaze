import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { FoodCard, Vote, VoteCell } from 'components';

export const Interactive: StoryObj<FoodCard> = {
  render: () => {
    const votes = signal<readonly VoteCell[]>([
      { name: 'Quinn', tone: 'primary', vote: 'up' },
      { name: 'Sara', tone: 'leaf', vote: 'none' },
      { name: 'Eli', tone: 'sky', vote: 'none' },
      { name: 'Mae', tone: 'sun', vote: 'down' },
    ]);
    const locked = signal(false);
    return {
      props: {
        votes,
        locked,
        cast: (change: { index: number; vote: Vote }) =>
          votes.update((cells) => cells.map((cell, i) => (i === change.index ? { ...cell, vote: change.vote } : cell))),
        lockIn: () => locked.set(true),
        reset: () => locked.set(false),
      },
      template: `
        <sd-food-card
          style="max-width: 420px"
          title="La Marina"
          meta="Mediterranean · Patio · 6 min from Terre Bleu"
          lockedLabel="Locked for lunch"
          menuUrl="https://example.com/la-marina/menu"
          [locked]="locked()"
          [votes]="votes()"
          [votesDisabled]="locked()"
          (voteChange)="cast($event)"
          (lockIn)="lockIn()"
        >
          <sd-chip slot="chips" tone="accent"><sd-icon name="heart" [size]="13" [stroke]="2" />Wife-approved</sd-chip>
        </sd-food-card>
        @if (locked()) {
          <sd-button class="sd-mt-4" variant="text" (click)="reset()">Unlock</sd-button>
        }
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Votes are controlled: `voteChange` emits `{ index, vote }` (pressing the current thumb clears it) and the page writes it back into `votes`. `lockIn` fires from Lock it in — on a screen it opens the lock dialog first.',
      },
    },
  },
};
