import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { ActivityCard, Avatar, Button, Chip, Disc, Icon, List, ListItem, Section } from 'components';

import descriptionMd from './SectionDescription.md';
import bestPracticesMd from './SectionBestPractices.md';

export { Default } from './SectionDefault.stories';
export { WithAction } from './SectionWithAction.stories';
export { WithCards } from './SectionWithCards.stories';
export { Untitled } from './SectionUntitled.stories';

export default {
  title: 'Components/Section',
  component: Section,
  decorators: [moduleMetadata({ imports: [Section, ActivityCard, Avatar, Button, Chip, Disc, Icon, List, ListItem] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Section>;
