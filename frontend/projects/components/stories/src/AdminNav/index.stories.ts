import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AdminNav } from 'components';

import descriptionMd from './AdminNavDescription.md';
import bestPracticesMd from './AdminNavBestPractices.md';

export { Default } from './AdminNavDefault.stories';
export { Bar } from './AdminNavBar.stories';

export default {
  title: 'Components/Admin Nav',
  component: AdminNav,
  decorators: [moduleMetadata({ imports: [AdminNav] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      // Sticky, full-height chrome: an iframe per story keeps it to the frame.
      story: { inline: false, height: '420px' },
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<AdminNav>;
