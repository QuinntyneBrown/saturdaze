import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Media } from 'components';

import descriptionMd from './MediaDescription.md';
import bestPracticesMd from './MediaBestPractices.md';

export { Default } from './MediaDefault.stories';
export { Fallback } from './MediaFallback.stories';
export { Ratio } from './MediaRatio.stories';

export default {
  title: 'Components/Media',
  component: Media,
  decorators: [moduleMetadata({ imports: [Media] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Media>;
