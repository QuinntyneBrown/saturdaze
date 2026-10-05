import { FormsModule } from '@angular/forms';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import {
  Avatar,
  BottomNav,
  Button,
  Card,
  Chip,
  ChipInput,
  Dialog,
  Disc,
  GhostRow,
  Icon,
  List,
  ListItem,
  PageHeader,
  Section,
  Toggle,
  TopBar,
} from 'components';

import descriptionMd from './FamilyPreferencesDescription.md';

export { Overview } from './FamilyPreferencesOverview.stories';
export { Mobile } from './FamilyPreferencesMobile.stories';
export { LikesEditor } from './FamilyPreferencesLikesEditor.stories';

export default {
  title: 'Patterns/Family Preferences',
  decorators: [
    moduleMetadata({
      imports: [
        TopBar,
        BottomNav,
        PageHeader,
        Section,
        List,
        ListItem,
        Avatar,
        Disc,
        GhostRow,
        Chip,
        Icon,
        Button,
        Toggle,
        Card,
        Dialog,
        ChipInput,
        FormsModule,
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
