import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Stepper } from 'components';

import descriptionMd from './StepperDescription.md';
import bestPracticesMd from './StepperBestPractices.md';

export { Default } from './StepperDefault.stories';
export { LastStep } from './StepperLastStep.stories';
export { ThreeSteps } from './StepperThreeSteps.stories';

export default {
  title: 'Components/Stepper',
  component: Stepper,
  decorators: [moduleMetadata({ imports: [Stepper] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Stepper>;
