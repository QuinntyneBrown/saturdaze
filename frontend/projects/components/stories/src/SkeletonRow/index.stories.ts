import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SkeletonRow } from 'components';

import descriptionMd from './SkeletonRowDescription.md';
import bestPracticesMd from './SkeletonRowBestPractices.md';

export { Default } from './SkeletonRowDefault.stories';
export { Stack } from './SkeletonRowStack.stories';

export default {
  title: 'Components/Skeleton Row',
  component: SkeletonRow,
  decorators: [moduleMetadata({ imports: [SkeletonRow] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<SkeletonRow>;
