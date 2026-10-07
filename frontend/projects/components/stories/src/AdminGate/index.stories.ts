import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AdminGate } from 'components';

import descriptionMd from './AdminGateDescription.md';
import bestPracticesMd from './AdminGateBestPractices.md';

export { Default } from './AdminGateDefault.stories';

export default {
  title: 'Components/Admin Gate',
  component: AdminGate,
  decorators: [moduleMetadata({ imports: [AdminGate] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      // The auth shell is min-height 100svh: an iframe per story keeps it to the frame.
      story: { inline: false, height: '640px' },
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<AdminGate>;
