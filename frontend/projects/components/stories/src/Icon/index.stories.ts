import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Icon } from 'components';

import descriptionMd from './IconDescription.md';
import bestPracticesMd from './IconBestPractices.md';

export { Default } from './IconDefault.stories';
export { Gallery } from './IconGallery.stories';
export { Size } from './IconSize.stories';
export { Filled } from './IconFilled.stories';
export { Color } from './IconColor.stories';
export { Stroke } from './IconStroke.stories';

export default {
  title: 'Components/Icon',
  component: Icon,
  decorators: [moduleMetadata({ imports: [Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Icon>;
