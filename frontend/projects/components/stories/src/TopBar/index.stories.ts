import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { BottomNav, Card, TopBar } from 'components';

import descriptionMd from './TopBarDescription.md';
import bestPracticesMd from './TopBarBestPractices.md';

export { Default } from './TopBarDefault.stories';
export { ActiveDestination } from './TopBarActiveDestination.stories';
export { Scrolled } from './TopBarScrolled.stories';
export { Handoff } from './TopBarHandoff.stories';
export { Photo } from './TopBarPhoto.stories';

export default {
  title: 'Components/Top Bar',
  component: TopBar,
  decorators: [moduleMetadata({ imports: [TopBar, BottomNav, Card] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      // Sticky/fixed chrome: render each story in its own iframe so it pins
      // to that frame rather than to the docs page.
      story: { inline: false, height: '160px' },
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<TopBar>;
