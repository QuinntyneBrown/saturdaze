import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { List, PlaceRow } from 'components';

import descriptionMd from './PlaceRowDescription.md';
import bestPracticesMd from './PlaceRowBestPractices.md';

export { Default } from './PlaceRowDefault.stories';
export { Flags } from './PlaceRowFlags.stories';

export default {
  title: 'Components/Place Row',
  component: PlaceRow,
  decorators: [moduleMetadata({ imports: [PlaceRow, List] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PlaceRow>;
