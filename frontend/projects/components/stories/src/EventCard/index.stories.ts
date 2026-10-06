import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Chip, EventCard, Icon } from 'components';

import descriptionMd from './EventCardDescription.md';
import bestPracticesMd from './EventCardBestPractices.md';

export { Default } from './EventCardDefault.stories';
export { TileDate } from './EventCardTileDate.stories';
export { Pending } from './EventCardPending.stories';

export default {
  title: 'Components/Event Card',
  component: EventCard,
  decorators: [moduleMetadata({ imports: [EventCard, Chip, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<EventCard>;
