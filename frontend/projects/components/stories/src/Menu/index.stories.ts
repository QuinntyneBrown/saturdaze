import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Dialog, Icon, Menu } from 'components';

import descriptionMd from './MenuDescription.md';
import bestPracticesMd from './MenuBestPractices.md';

export { Default } from './MenuDefault.stories';
export { Anchored } from './MenuAnchored.stories';
export { Sheet } from './MenuSheet.stories';
export { OpenWithOverlay } from './MenuOpenWithOverlay.stories';

export default {
  title: 'Components/Menu',
  component: Menu,
  decorators: [moduleMetadata({ imports: [Menu, Dialog, Button, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Menu>;
