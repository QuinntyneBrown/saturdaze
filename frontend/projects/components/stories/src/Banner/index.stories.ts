import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Banner, Button } from 'components';

import descriptionMd from './BannerDescription.md';
import bestPracticesMd from './BannerBestPractices.md';

export { Default } from './BannerDefault.stories';
export { Tone } from './BannerTone.stories';
export { ErrorAlert } from './BannerErrorAlert.stories';
export { NoIcon } from './BannerNoIcon.stories';

export default {
  title: 'Components/Banner',
  component: Banner,
  decorators: [moduleMetadata({ imports: [Banner, Button] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Banner>;
