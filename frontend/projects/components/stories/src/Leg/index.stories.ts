import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Leg } from 'components';

import descriptionMd from './LegDescription.md';
import bestPracticesMd from './LegBestPractices.md';

export { Default } from './LegDefault.stories';
export { Short } from './LegShort.stories';

export default {
  title: 'Components/Leg',
  component: Leg,
  decorators: [moduleMetadata({ imports: [Leg] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Leg>;
