import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import {
  Block,
  BottomNav,
  Button,
  Chip,
  Day,
  Disc,
  Empty,
  GhostRow,
  Icon,
  List,
  ListItem,
  PageHeader,
  Section,
  SkeletonRow,
  StatusRow,
  TopBar,
} from 'components';

import descriptionMd from './WeekendPlanDescription.md';

export { Ready } from './WeekendPlanReady.stories';
export { Mobile } from './WeekendPlanMobile.stories';
export { LockedDay } from './WeekendPlanLockedDay.stories';
export { NoPlan } from './WeekendPlanNoPlan.stories';
export { Generating } from './WeekendPlanGenerating.stories';

export default {
  title: 'Patterns/Weekend Plan',
  decorators: [
    moduleMetadata({
      imports: [
        TopBar,
        BottomNav,
        PageHeader,
        Day,
        Block,
        Chip,
        Icon,
        Button,
        GhostRow,
        SkeletonRow,
        StatusRow,
        Empty,
        Section,
        List,
        ListItem,
        Disc,
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
