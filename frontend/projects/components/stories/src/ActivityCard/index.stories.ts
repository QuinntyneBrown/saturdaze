import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { ActivityCard, Chip, Icon } from 'components';

import descriptionMd from './ActivityCardDescription.md';
import bestPracticesMd from './ActivityCardBestPractices.md';

export { Default } from './ActivityCardDefault.stories';
export { Tone } from './ActivityCardTone.stories';
export { WithMap } from './ActivityCardWithMap.stories';
export { WithPhoto } from './ActivityCardWithPhoto.stories';

export default {
  title: 'Components/Activity Card',
  component: ActivityCard,
  decorators: [moduleMetadata({ imports: [ActivityCard, Chip, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<ActivityCard>;
