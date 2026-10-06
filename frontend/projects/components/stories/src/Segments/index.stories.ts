import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Segments } from 'components';

import descriptionMd from './SegmentsDescription.md';
import bestPracticesMd from './SegmentsBestPractices.md';

export { Default } from './SegmentsDefault.stories';
export { Narrow } from './SegmentsNarrow.stories';
export { Interactive } from './SegmentsInteractive.stories';

export default {
  title: 'Components/Segments',
  component: Segments,
  decorators: [moduleMetadata({ imports: [Segments] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Segments>;
