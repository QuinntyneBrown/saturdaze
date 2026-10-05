import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Avatar } from 'components';

import descriptionMd from './AvatarDescription.md';
import bestPracticesMd from './AvatarBestPractices.md';

export { Default } from './AvatarDefault.stories';
export { Tone } from './AvatarTone.stories';
export { Size } from './AvatarSize.stories';
export { Initials } from './AvatarInitials.stories';

export default {
  title: 'Components/Avatar',
  component: Avatar,
  decorators: [moduleMetadata({ imports: [Avatar] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Avatar>;
