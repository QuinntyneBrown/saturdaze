import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SlotPreview } from 'components';

import descriptionMd from './SlotPreviewDescription.md';
import bestPracticesMd from './SlotPreviewBestPractices.md';

export { Default } from './SlotPreviewDefault.stories';
export { Fallback } from './SlotPreviewFallback.stories';

export default {
  title: 'Components/Slot Preview',
  component: SlotPreview,
  decorators: [moduleMetadata({ imports: [SlotPreview] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<SlotPreview>;
