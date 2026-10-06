import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { BottomNav, Card } from 'components';

import descriptionMd from './BottomNavDescription.md';
import bestPracticesMd from './BottomNavBestPractices.md';

export { Default } from './BottomNavDefault.stories';
export { WithPage } from './BottomNavWithPage.stories';
export { ChromeClearance } from './BottomNavChromeClearance.stories';
export { Xsmall } from './BottomNavXsmall.stories';

export default {
  title: 'Components/Bottom Nav',
  component: BottomNav,
  decorators: [moduleMetadata({ imports: [BottomNav, Card] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      // position: fixed — each story gets its own iframe with room for the
      // pill. It is hidden from 720px, so on a wide docs page open the
      // canvas (Mobile viewport) to see it.
      story: { inline: false, height: '480px' },
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<BottomNav>;
