import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { DateTile } from 'components';

import descriptionMd from './DateTileDescription.md';
import bestPracticesMd from './DateTileBestPractices.md';

export { Default } from './DateTileDefault.stories';
export { FromDate } from './DateTileFromDate.stories';
export { SplitParts } from './DateTileSplitParts.stories';
export { InARow } from './DateTileInARow.stories';

export default {
  title: 'Components/Date Tile',
  component: DateTile,
  decorators: [moduleMetadata({ imports: [DateTile] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<DateTile>;
