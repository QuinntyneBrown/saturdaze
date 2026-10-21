import type { StoryObj } from '@storybook/angular';

import type { Stepper } from 'components';

export const ThreeSteps: StoryObj<Stepper> = {
  args: { step: 1, count: 3 },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 440px">
        <sd-stepper [step]="step" [count]="count" />
      </div>
    `,
  }),
};
