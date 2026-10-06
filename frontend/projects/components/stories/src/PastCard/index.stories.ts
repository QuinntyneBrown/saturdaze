import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { PastCard } from 'components';

import descriptionMd from './PastCardDescription.md';
import bestPracticesMd from './PastCardBestPractices.md';

export { Default } from './PastCardDefault.stories';
export { WithCover } from './PastCardWithCover.stories';
export { AddAPhoto } from './PastCardAddAPhoto.stories';
export { Unrated } from './PastCardUnrated.stories';
export { Interactive } from './PastCardInteractive.stories';
export { Grid } from './PastCardGrid.stories';

export default {
  title: 'Components/Past Card',
  component: PastCard,
  decorators: [moduleMetadata({ imports: [PastCard] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PastCard>;
