import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { EmailPreview } from 'components';

import descriptionMd from './EmailPreviewDescription.md';
import bestPracticesMd from './EmailPreviewBestPractices.md';

export { Default } from './EmailPreviewDefault.stories';
export { MissingSample } from './EmailPreviewMissingSample.stories';
export { Refused } from './EmailPreviewRefused.stories';

export default {
  title: 'Components/Email Preview',
  component: EmailPreview,
  decorators: [moduleMetadata({ imports: [EmailPreview] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<EmailPreview>;
