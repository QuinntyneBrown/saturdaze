import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Block, Chip, Day, GhostRow, Icon, SkeletonRow } from 'components';

import descriptionMd from './DayDescription.md';
import bestPracticesMd from './DayBestPractices.md';

export { Default } from './DayDefault.stories';
export { Weekend } from './DayWeekend.stories';
export { Weather } from './DayWeather.stories';
export { Locked } from './DayLocked.stories';
export { Loading } from './DayLoading.stories';
export { ReadOnly } from './DayReadOnly.stories';

export default {
  title: 'Components/Day',
  component: Day,
  decorators: [moduleMetadata({ imports: [Day, Block, Chip, GhostRow, Icon, SkeletonRow] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Day>;
