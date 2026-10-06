import type { StoryObj } from '@storybook/angular';

import type { VoteCell } from 'components';

import { appShell } from '../shared/shell';
import { IDEAS_STYLES, IDEAS_TABS, ideasHeader } from './ideas';

const votes = (
  q: VoteCell['vote'],
  s: VoteCell['vote'],
  e: VoteCell['vote'],
  m: VoteCell['vote'],
): VoteCell[] => [
  { name: 'Quinn', tone: 'primary', vote: q },
  { name: 'Sara', tone: 'sun', vote: s },
  { name: 'Eli', tone: 'sky', vote: e },
  { name: 'Mae', tone: 'leaf', vote: m },
];

export const Food: StoryObj = {
  render: () => ({
    props: {
      tabs: IDEAS_TABS,
      marina: votes('up', 'up', 'up', 'none'),
      symposium: votes('none', 'up', 'none', 'up'),
      sicilian: votes('none', 'none', 'down', 'none'),
      fishbone: votes('up', 'up', 'up', 'up'),
      snug: votes('up', 'none', 'down', 'none'),
    },
    styles: IDEAS_STYLES,
    template: appShell(
      'ideas',
      `
        ${ideasHeader('Places to eat near what you are already doing.', 'Food')}
        <sd-filters class="filters" label="Filters">
          <sd-filter-chip pressed>Saturday</sd-filter-chip>
          <sd-filter-chip>Sunday</sd-filter-chip>
          <span class="sd-vdivider" aria-hidden="true"></span>
          <sd-filter-chip pressed>Lunch</sd-filter-chip>
          <sd-filter-chip>Dinner</sd-filter-chip>
          <span class="sd-vdivider" aria-hidden="true"></span>
          <sd-filter-chip tone="accent"><sd-icon name="heart" [size]="14" [stroke]="2" />Wife-approved</sd-filter-chip>
          <sd-filter-chip>Under 15 min</sd-filter-chip>
        </sd-filters>

        <sd-section class="section" title="Lunch" subtitle="Near Terre Bleu · 12:00 to 1:30">
          <div class="sd-grid-cards sd-grid-cards--2">
            <sd-food-card title="La Marina" meta="Mediterranean · Patio · 6 min from Terre Bleu"
              tone="sun" topPick menuUrl="https://example.com/la-marina/menu" [votes]="marina">
              <sd-chip slot="chips" tone="accent"><sd-icon name="heart" [size]="13" [stroke]="2" />Wife-approved</sd-chip>
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />6 min</sd-chip>
            </sd-food-card>
            <sd-food-card title="Symposium Café" meta="Brunch · Family booths · 9 min from Terre Bleu"
              menuUrl="https://example.com/symposium/menu" [votes]="symposium">
              <sd-chip slot="chips" tone="accent"><sd-icon name="heart" [size]="13" [stroke]="2" />Wife-approved</sd-chip>
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />9 min</sd-chip>
            </sd-food-card>
            <sd-food-card title="The Sicilian Sidewalk Café" meta="Italian · Casual · On the way back to Port Credit"
              menuUrl="https://example.com/sicilian/menu" [votes]="sicilian">
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />14 min</sd-chip>
            </sd-food-card>
          </div>
        </sd-section>

        <sd-section class="section" title="Dinner" subtitle="Saturday · locked in">
          <div class="sd-grid-cards sd-grid-cards--2">
            <sd-food-card title="Fishbone" meta="Seafood · Patio · 4 min from home" tone="sun"
              locked lockedLabel="Locked for Saturday dinner" menuUrl="https://example.com/fishbone/menu" [votes]="fishbone" votesDisabled>
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />4 min</sd-chip>
            </sd-food-card>
            <sd-food-card title="Snug Harbour" meta="Seafood · Waterfront · 6 min from home"
              dimmed menuUrl="https://example.com/snug/menu" [votes]="snug" votesDisabled>
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />6 min</sd-chip>
            </sd-food-card>
          </div>
        </sd-section>
      `,
    ),
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'Restaurants in the two-column grid. The top pick spans both columns (`topPick` sets `card--span`) with a sun disc; each card carries the family vote row, "See menu" and "Lock it in". Under Dinner one pick is `locked` (accent border, no lock button) and its sibling is `dimmed` with `votesDisabled`.',
      },
    },
  },
};
