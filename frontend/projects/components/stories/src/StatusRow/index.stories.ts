import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SkeletonRow, StatusRow } from 'components';

import descriptionMd from './StatusRowDescription.md';
import bestPracticesMd from './StatusRowBestPractices.md';

export { Default } from './StatusRowDefault.stories';
export { Screens } from './StatusRowScreens.stories';
export { WithSkeletons } from './StatusRowWithSkeletons.stories';

export default {
  title: 'Components/Status Row',
  component: StatusRow,
  decorators: [moduleMetadata({ imports: [StatusRow, SkeletonRow] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<StatusRow>;
