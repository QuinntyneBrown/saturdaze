import type { StoryObj } from '@storybook/angular';

import type { FoodCard } from 'components';

export const Locked: StoryObj<FoodCard> = {
  render: () => ({
    props: {
      votes: [
        { name: 'Quinn', tone: 'primary', vote: 'up' },
        { name: 'Sara', tone: 'leaf', vote: 'up' },
        { name: 'Eli', tone: 'sky', vote: 'none' },
        { name: 'Mae', tone: 'sun', vote: 'up' },
      ],
    },
    template: `
      <div class="sd-grid-cards sd-grid-cards--2" style="max-width: 860px">
        <sd-food-card
          locked
          lockedLabel="Locked for dinner"
          title="Snug Harbour"
          meta="Seafood · Waterfront · 4 min from home"
          menuUrl="https://example.com/snug-harbour/menu"
          [votes]="votes"
        >
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />4 min</sd-chip>
        </sd-food-card>
        <sd-food-card dimmed votesDisabled title="Mondo Pizza" meta="Pizza · Counter service · 7 min from home" [votes]="votes">
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />7 min</sd-chip>
        </sd-food-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`locked` draws the accent border, tints the disc and replaces Lock it in with a `lockedLabel` chip. Its siblings are `dimmed` (Lock it in disabled) with `votesDisabled`.',
      },
    },
  },
};
