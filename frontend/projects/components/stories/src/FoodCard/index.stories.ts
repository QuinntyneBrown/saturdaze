import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Chip, FoodCard, Icon } from 'components';

import descriptionMd from './FoodCardDescription.md';
import bestPracticesMd from './FoodCardBestPractices.md';

export { Default } from './FoodCardDefault.stories';
export { TopPick } from './FoodCardTopPick.stories';
export { Locked } from './FoodCardLocked.stories';
export { Interactive } from './FoodCardInteractive.stories';

export default {
  title: 'Components/Food Card',
  component: FoodCard,
  decorators: [moduleMetadata({ imports: [FoodCard, Button, Chip, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<FoodCard>;
