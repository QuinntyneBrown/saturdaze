import type { StoryObj } from '@storybook/angular';

import type { FoodCard } from 'components';

export const Default: StoryObj<FoodCard & { title: string }> = {
  args: {
    title: 'Symposium Café',
    meta: 'Brunch · Family booths · 9 min from Terre Bleu',
    tone: 'default',
    topPick: false,
    locked: false,
    lockedLabel: 'Locked for lunch',
    dimmed: false,
    menuUrl: 'https://example.com/symposium/menu',
    votes: [
      { name: 'Quinn', tone: 'primary', vote: 'none' },
      { name: 'Sara', tone: 'leaf', vote: 'up' },
      { name: 'Eli', tone: 'sky', vote: 'none' },
      { name: 'Mae', tone: 'sun', vote: 'up' },
    ],
    votesDisabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-food-card
        style="max-width: 420px"
        [title]="title"
        [meta]="meta"
        [tone]="tone"
        [topPick]="topPick"
        [locked]="locked"
        [lockedLabel]="lockedLabel"
        [dimmed]="dimmed"
        [menuUrl]="menuUrl"
        [votes]="votes"
        [votesDisabled]="votesDisabled"
      >
        <sd-chip slot="chips" tone="accent"><sd-icon name="heart" [size]="13" [stroke]="2" />Wife-approved</sd-chip>
        <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />9 min</sd-chip>
      </sd-food-card>
    `,
  }),
};
