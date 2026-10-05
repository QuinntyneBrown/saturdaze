import type { StoryObj } from '@storybook/angular';

import type { Block } from 'components';

export const Kinds: StoryObj<Block> = {
  render: () => ({
    template: `
      <div role="list" style="max-width: 560px">
        <sd-block time="8:30" duration="30m" icon="home" title="Breakfast at home" subtitle="Cereal day, Eli's choice" />
        <sd-block commitment time="9:00" duration="60m" icon="bike" title="Swim lessons" subtitle="Every Saturday · locked in">
          <sd-chip slot="chips" tone="accent"><sd-icon name="lock" [size]="13" [stroke]="2" />Commitment</sd-chip>
        </sd-block>
        <sd-block drive time="10:30" duration="45m" icon="car" title="Drive to Terre Bleu" />
        <sd-block errand time="15:00" duration="45m" icon="bag" title="Costco run" subtitle="Paper towels, bread, yogurt">
          <sd-chip slot="chips" tone="indoor">Errand</sd-chip>
        </sd-block>
        <sd-block locked time="19:30" duration="30m" icon="bed" title="Bath and books" subtitle="Lights out at 9">
          <sd-chip slot="chips" tone="accent"><sd-icon name="lock" [size]="13" [stroke]="2" />Locked</sd-chip>
        </sd-block>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A plain planned row, then `commitment` (a weekly anchor), `drive` (compact, no actions or chevron), `errand` and `locked`. Each is a host modifier; the chip saying so is projected by the page.',
      },
    },
  },
};
