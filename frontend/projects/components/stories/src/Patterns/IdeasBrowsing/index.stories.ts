import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import {
  ActivityCard,
  BottomNav,
  Button,
  Chip,
  EventCard,
  FilterChip,
  Filters,
  FoodCard,
  Icon,
  PageHeader,
  Section,
  Segments,
  TopBar,
} from 'components';

import descriptionMd from './IdeasBrowsingDescription.md';

export { Activities } from './IdeasBrowsingActivities.stories';
export { Food } from './IdeasBrowsingFood.stories';
export { Events } from './IdeasBrowsingEvents.stories';
export { Mobile } from './IdeasBrowsingMobile.stories';

export default {
  title: 'Patterns/Ideas Browsing',
  decorators: [
    moduleMetadata({
      imports: [
        TopBar,
        BottomNav,
        PageHeader,
        Segments,
        Filters,
        FilterChip,
        Section,
        ActivityCard,
        FoodCard,
        EventCard,
        Chip,
        Icon,
        Button,
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, height: '900px' },
      description: {
        component: descriptionMd,
      },
    },
  },
} as Meta;
