import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Chip, Icon } from 'components';

import descriptionMd from './ChipDescription.md';
import bestPracticesMd from './ChipBestPractices.md';

export { Default } from './ChipDefault.stories';
export { Tone } from './ChipTone.stories';
export { WithIcon } from './ChipWithIcon.stories';
export { Size } from './ChipSize.stories';
export { Count } from './ChipCount.stories';
export { Removable } from './ChipRemovable.stories';

export default {
  title: 'Components/Chip',
  component: Chip,
  decorators: [moduleMetadata({ imports: [Chip, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Chip>;
