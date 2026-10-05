import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { ActivityCard, Block, BrowserFrame, Chip, Day, Icon } from 'components';

import descriptionMd from './BrowserFrameDescription.md';
import bestPracticesMd from './BrowserFrameBestPractices.md';

export { Default } from './BrowserFrameDefault.stories';
export { Scaling } from './BrowserFrameScaling.stories';
export { CustomSize } from './BrowserFrameCustomSize.stories';

export default {
  title: 'Components/Browser Frame',
  component: BrowserFrame,
  decorators: [moduleMetadata({ imports: [BrowserFrame, Day, Block, Chip, Icon, ActivityCard] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<BrowserFrame>;
