import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Stars } from 'components';

import descriptionMd from './StarsDescription.md';
import bestPracticesMd from './StarsBestPractices.md';

export { Default } from './StarsDefault.stories';
export { Rating } from './StarsRating.stories';
export { Size } from './StarsSize.stories';
export { Editable } from './StarsEditable.stories';

export default {
  title: 'Components/Stars',
  component: Stars,
  decorators: [moduleMetadata({ imports: [Stars] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Stars>;
