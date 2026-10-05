import type { StoryObj } from '@storybook/angular';

import type { Day } from 'components';

export const Weekend: StoryObj<Day> = {
  render: () => ({
    template: `
      <div class="sd-grid-days">
        <sd-day title="Saturday" meta="17 May · 22° / 14° · Light breeze, good for outdoors" weather="sun">
          <sd-block time="8:30" duration="30m" icon="home" title="Breakfast at home" subtitle="Cereal day, Eli's choice" />
          <sd-block commitment time="9:00" duration="60m" icon="bike" title="Swim lessons" subtitle="Every Saturday · locked in">
            <sd-chip slot="chips" tone="accent"><sd-icon name="lock" [size]="13" [stroke]="2" />Commitment</sd-chip>
          </sd-block>
          <sd-block drive time="10:30" duration="45m" icon="car" title="Drive to Terre Bleu" />
          <sd-block time="11:00" duration="2h" icon="tree" title="Lavender fields" subtitle="Terre Bleu, Milton · walk the rows">
            <sd-chip slot="chips" tone="primary">Day highlight</sd-chip>
          </sd-block>
          <sd-ghost-row slot="footer" icon="bag">Add an errand</sd-ghost-row>
        </sd-day>
        <sd-day title="Sunday" meta="18 May · 18° / 12° · Cloudy by 2pm, indoor afternoon" weather="cloud">
          <sd-block time="8:30" duration="45m" icon="home" title="Pancakes at home" subtitle="Mae flips, Eli pours" />
          <sd-block errand time="9:30" duration="45m" icon="bag" title="Costco run" subtitle="Paper towels, bread, yogurt">
            <sd-chip slot="chips" tone="indoor">Errand</sd-chip>
          </sd-block>
          <sd-block drive time="14:00" duration="15m" icon="car" title="Drive to Square One" />
          <sd-block time="14:30" duration="2h" icon="popcorn" title="The Rec Room" subtitle="Bowling and arcade · Eli's pick">
            <sd-chip slot="chips" tone="primary">Day highlight</sd-chip>
          </sd-block>
          <sd-ghost-row slot="footer" icon="bag">Add an errand</sd-ghost-row>
        </sd-day>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'The Weekend screen: Saturday and Sunday in `sd-grid-days`, side by side from tablet up and stacked on phones.',
      },
    },
  },
};
