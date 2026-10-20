import type { StoryObj } from '@storybook/angular';

import type { Stepper } from 'components';

export const Default: StoryObj<Stepper> = {
  args: { step: 2, count: 4 },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 440px">
        <sd-stepper [step]="step" [count]="count" />
      </div>
    `,
  }),
};
