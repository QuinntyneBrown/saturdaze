import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Pager } from 'components';

import descriptionMd from './PagerDescription.md';
import bestPracticesMd from './PagerBestPractices.md';

export { Default } from './PagerDefault.stories';
export { MiddlePage } from './PagerMiddlePage.stories';
export { Empty } from './PagerEmpty.stories';

export default {
  title: 'Components/Pager',
  component: Pager,
  decorators: [moduleMetadata({ imports: [Pager] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Pager>;
