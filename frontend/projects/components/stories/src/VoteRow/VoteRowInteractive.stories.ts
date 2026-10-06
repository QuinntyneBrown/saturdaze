import { computed, signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Vote, VoteCell, VoteRow } from 'components';

export const Interactive: StoryObj<VoteRow> = {
  render: () => {
    const votes = signal<readonly VoteCell[]>([
      { name: 'Quinn', tone: 'primary', vote: 'none' },
      { name: 'Sara', tone: 'leaf', vote: 'none' },
      { name: 'Eli', tone: 'sky', vote: 'none' },
      { name: 'Mae', tone: 'sun', vote: 'none' },
    ]);
    const tally = computed(() => {
      const yes = votes().filter((v) => v.vote === 'up').length;
      return `${yes} of ${votes().length} votes`;
    });
    return {
      props: {
        votes,
        tally,
        cast: (change: { index: number; vote: Vote }) =>
          votes.update((cells) =>
            cells.map((cell, i) => (i === change.index ? { ...cell, vote: change.vote } : cell)),
          ),
      },
      template: `
        <sd-vote-row style="max-width: 420px" label="Family vote for Symposium Café" [votes]="votes()" (voteChange)="cast($event)" />
        <p class="sd-text-sm sd-text-soft sd-mt-4">Symposium Café · {{ tally() }}</p>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          "`voteChange` emits `{ index, vote }`; write it back into `votes`. Pressing the thumb that is already pressed clears that member's vote to `none`.",
      },
    },
  },
};
