import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Disc } from 'components';

import descriptionMd from './DiscDescription.md';
import bestPracticesMd from './DiscBestPractices.md';

export { Default } from './DiscDefault.stories';
export { Tone } from './DiscTone.stories';
export { Size } from './DiscSize.stories';
export { InARow } from './DiscInARow.stories';

export default {
  title: 'Components/Disc',
  component: Disc,
  decorators: [moduleMetadata({ imports: [Disc] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Disc>;
