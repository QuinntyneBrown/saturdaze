import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Spinner } from 'components';

import descriptionMd from './SpinnerDescription.md';
import bestPracticesMd from './SpinnerBestPractices.md';

export { Default } from './SpinnerDefault.stories';
export { WithIcon } from './SpinnerWithIcon.stories';
export { Size } from './SpinnerSize.stories';

export default {
  title: 'Components/Spinner',
  component: Spinner,
  decorators: [moduleMetadata({ imports: [Spinner] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Spinner>;
