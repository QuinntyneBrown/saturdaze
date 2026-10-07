import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Icon, PhotoTile } from 'components';

import descriptionMd from './PhotoTileDescription.md';
import bestPracticesMd from './PhotoTileBestPractices.md';

export { Default } from './PhotoTileDefault.stories';
export { Blocked } from './PhotoTileBlocked.stories';

export default {
  title: 'Components/Photo Tile',
  component: PhotoTile,
  decorators: [moduleMetadata({ imports: [PhotoTile, Button, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PhotoTile>;
