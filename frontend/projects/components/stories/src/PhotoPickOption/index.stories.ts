import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Icon, PhotoPick, PhotoPickOption } from 'components';

import descriptionMd from './PhotoPickOptionDescription.md';
import bestPracticesMd from './PhotoPickOptionBestPractices.md';

export { Default } from './PhotoPickOptionDefault.stories';
export { Media } from './PhotoPickOptionMedia.stories';
export { Plain } from './PhotoPickOptionPlain.stories';

export default {
  title: 'Components/Photo Pick Option',
  component: PhotoPickOption,
  decorators: [moduleMetadata({ imports: [PhotoPick, PhotoPickOption, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PhotoPickOption>;
