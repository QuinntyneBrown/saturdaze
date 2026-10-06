import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Card, Scrolled, TopBar } from 'components';

import descriptionMd from './ScrolledDescription.md';
import bestPracticesMd from './ScrolledBestPractices.md';

export { Default } from './ScrolledDefault.stories';
export { HostDirective } from './ScrolledHostDirective.stories';

export default {
  title: 'Components/Scrolled',
  component: Scrolled,
  decorators: [moduleMetadata({ imports: [Scrolled, TopBar, Card] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      // The directive listens to window scroll: give each story its own
      // window (iframe) so scrolling the docs page doesn't drive it.
      story: { inline: false, height: '320px' },
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Scrolled>;
