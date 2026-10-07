import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Icon, PhotoDrop, PhotoPick, PhotoPickOption } from 'components';

import descriptionMd from './PhotoPickDescription.md';
import bestPracticesMd from './PhotoPickBestPractices.md';

export { Default } from './PhotoPickDefault.stories';
export { WithUpload } from './PhotoPickWithUpload.stories';

export default {
  title: 'Components/Photo Pick',
  component: PhotoPick,
  decorators: [moduleMetadata({ imports: [PhotoPick, PhotoPickOption, PhotoDrop, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PhotoPick>;
