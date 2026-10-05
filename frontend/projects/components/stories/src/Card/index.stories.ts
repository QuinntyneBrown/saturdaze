import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Card, Chip, Icon } from 'components';

import descriptionMd from './CardDescription.md';
import bestPracticesMd from './CardBestPractices.md';

export { Default } from './CardDefault.stories';
export { Variant } from './CardVariant.stories';
export { Padding } from './CardPadding.stories';
export { States } from './CardStates.stories';
export { Span } from './CardSpan.stories';

export default {
  title: 'Components/Card',
  component: Card,
  decorators: [moduleMetadata({ imports: [Card, Chip, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Card>;
