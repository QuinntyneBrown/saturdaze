import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Cover, Icon } from 'components';

import descriptionMd from './CoverDescription.md';
import bestPracticesMd from './CoverBestPractices.md';

export { Default } from './CoverDefault.stories';
export { Fallback } from './CoverFallback.stories';

export default {
  title: 'Components/Cover',
  component: Cover,
  decorators: [moduleMetadata({ imports: [Button, Cover, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Cover>;
