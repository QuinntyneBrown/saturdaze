import type { StoryObj } from '@storybook/angular';

import type { FoodCard } from 'components';

export const TopPick: StoryObj<FoodCard> = {
  render: () => ({
    props: {
      marina: [
        { name: 'Quinn', tone: 'primary', vote: 'up' },
        { name: 'Sara', tone: 'leaf', vote: 'up' },
        { name: 'Eli', tone: 'sky', vote: 'up' },
        { name: 'Mae', tone: 'sun', vote: 'none' },
      ],
      sicilian: [
        { name: 'Quinn', tone: 'primary', vote: 'up' },
        { name: 'Sara', tone: 'leaf', vote: 'down' },
        { name: 'Eli', tone: 'sky', vote: 'up' },
        { name: 'Mae', tone: 'sun', vote: 'up' },
      ],
    },
    template: `
      <div class="sd-grid-cards sd-grid-cards--2" style="max-width: 860px">
        <sd-food-card
          topPick
          tone="sun"
          title="La Marina"
          meta="Mediterranean · Patio · 6 min from Terre Bleu"
          menuUrl="https://example.com/la-marina/menu"
          [votes]="marina"
        >
          <sd-chip slot="chips" tone="accent"><sd-icon name="heart" [size]="13" [stroke]="2" />Wife-approved</sd-chip>
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />6 min</sd-chip>
        </sd-food-card>
        <sd-food-card
          title="The Sicilian Sidewalk Café"
          meta="Italian · Casual · On the way back to Port Credit"
          menuUrl="https://example.com/sicilian/menu"
          [votes]="sicilian"
        >
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />12 min</sd-chip>
        </sd-food-card>
        <sd-food-card title="Snug Harbour" meta="Seafood · Waterfront · 4 min from home" [votes]="sicilian">
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />4 min</sd-chip>
        </sd-food-card>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`topPick` spans the grid (`.card--span`) and adds the "Top pick" chip; the page also passes `tone="sun"` for its disc.',
      },
    },
  },
};
