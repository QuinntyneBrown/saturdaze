import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import {
  Avatar,
  Block,
  BottomNav,
  Button,
  Chip,
  Day,
  GhostRow,
  Icon,
  List,
  ListItem,
  PageHeader,
  Section,
  Sitebar,
  TopBar,
} from 'components';

import descriptionMd from './ShellNavigationDescription.md';

export { MobileBottomNav } from './ShellNavigationMobileBottomNav.stories';
export { DesktopTopBar } from './ShellNavigationDesktopTopBar.stories';
export { Tablet } from './ShellNavigationTablet.stories';
export { SiteShell } from './ShellNavigationSiteShell.stories';

export default {
  title: 'Patterns/Shell & Navigation',
  decorators: [
    moduleMetadata({
      imports: [
        TopBar,
        BottomNav,
        Sitebar,
        PageHeader,
        Section,
        List,
        ListItem,
        Avatar,
        Day,
        Block,
        Chip,
        Icon,
        Button,
        GhostRow,
      ],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, height: '720px' },
      description: {
        component: descriptionMd,
      },
    },
  },
} as Meta;
