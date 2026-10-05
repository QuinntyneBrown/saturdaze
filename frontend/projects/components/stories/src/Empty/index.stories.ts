import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Empty, Icon } from 'components';

import descriptionMd from './EmptyDescription.md';
import bestPracticesMd from './EmptyBestPractices.md';

export { Default } from './EmptyDefault.stories';
export { Warm } from './EmptyWarm.stories';
export { Tone } from './EmptyTone.stories';

export default {
  title: 'Components/Empty',
  component: Empty,
  decorators: [moduleMetadata({ imports: [Empty, Button, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Empty>;
