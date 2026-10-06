import type { StoryObj } from '@storybook/angular';

import type { Block } from 'components';

export const Default: StoryObj<Block & { title: string }> = {
  args: {
    time: '11:00',
    duration: '2h',
    icon: 'tree',
    title: 'Lavender fields',
    subtitle: 'Terre Bleu, Milton · walk the rows',
    commitment: false,
    locked: false,
    drive: false,
    errand: false,
    done: false,
    readonly: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div role="list" style="max-width: 560px">
        <sd-block
          [time]="time"
          [duration]="duration"
          [icon]="icon"
          [title]="title"
          [subtitle]="subtitle"
          [commitment]="commitment"
          [locked]="locked"
          [drive]="drive"
          [errand]="errand"
          [done]="done"
          [readonly]="readonly"
        >
          <sd-chip slot="chips" tone="primary">Day highlight</sd-chip>
          <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />45 min drive</sd-chip>
        </sd-block>
      </div>
    `,
  }),
};
