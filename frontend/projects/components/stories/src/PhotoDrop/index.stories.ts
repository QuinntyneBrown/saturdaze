import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Icon, PhotoDrop, PhotoPick } from 'components';

import descriptionMd from './PhotoDropDescription.md';
import bestPracticesMd from './PhotoDropBestPractices.md';

export { Default } from './PhotoDropDefault.stories';
export { Preview } from './PhotoDropPreview.stories';
export { Tile } from './PhotoDropTile.stories';

export default {
  title: 'Components/Photo Drop',
  component: PhotoDrop,
  decorators: [moduleMetadata({ imports: [PhotoDrop, PhotoPick, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PhotoDrop>;
