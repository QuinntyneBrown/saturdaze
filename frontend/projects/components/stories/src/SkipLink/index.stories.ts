import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SkipLink } from 'components';

import descriptionMd from './SkipLinkDescription.md';
import bestPracticesMd from './SkipLinkBestPractices.md';

export { Default } from './SkipLinkDefault.stories';

export default {
  title: 'Components/SkipLink',
  component: SkipLink,
  decorators: [moduleMetadata({ imports: [SkipLink] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<SkipLink>;
