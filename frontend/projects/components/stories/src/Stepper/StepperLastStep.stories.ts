import type { StoryObj } from '@storybook/angular';

import type { Stepper } from 'components';

export const LastStep: StoryObj<Stepper> = {
  args: { step: 4, count: 4 },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 440px">
        <sd-stepper [step]="step" [count]="count" />
      </div>
    `,
  }),
};
