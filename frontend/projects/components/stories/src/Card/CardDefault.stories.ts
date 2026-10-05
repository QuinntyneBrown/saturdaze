import type { StoryObj } from '@storybook/angular';

import type { Card } from 'components';

export const Default: StoryObj<Card> = {
  args: {
    variant: 'default',
    padding: 'md',
    locked: false,
    dimmed: false,
    muted: false,
    span: false,
    interactive: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-card
        style="max-width: 360px"
        [variant]="variant"
        [padding]="padding"
        [locked]="locked"
        [dimmed]="dimmed"
        [muted]="muted"
        [span]="span"
        [interactive]="interactive"
      >
        <strong>Saturday at the farmers' market</strong>
        <span class="sd-text-sm sd-text-soft">Port Credit · 8am to 1pm</span>
        <div class="sd-cluster">
          <sd-chip tone="leaf">Outdoor</sd-chip>
          <sd-chip tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />5 min</sd-chip>
        </div>
      </sd-card>
    `,
  }),
};
