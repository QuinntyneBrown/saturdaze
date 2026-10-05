import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Card, Chip, Details, Icon } from 'components';

import descriptionMd from './DetailsDescription.md';
import bestPracticesMd from './DetailsBestPractices.md';

export { Default } from './DetailsDefault.stories';
export { MissingValues } from './DetailsMissingValues.stories';
export { WithLink } from './DetailsWithLink.stories';
export { InCard } from './DetailsInCard.stories';

export default {
  title: 'Components/Details',
  component: Details,
  decorators: [moduleMetadata({ imports: [Details, Button, Card, Chip, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Details>;
