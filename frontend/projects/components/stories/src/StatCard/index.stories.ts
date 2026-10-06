import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { StatCard } from 'components';

import descriptionMd from './StatCardDescription.md';
import bestPracticesMd from './StatCardBestPractices.md';

export { Default } from './StatCardDefault.stories';
export { Empty } from './StatCardEmpty.stories';

export default {
  title: 'Components/Stat Card',
  component: StatCard,
  decorators: [moduleMetadata({ imports: [StatCard] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<StatCard>;
