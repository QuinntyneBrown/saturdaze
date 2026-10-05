import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Sitebar } from 'components';

import descriptionMd from './SitebarDescription.md';
import bestPracticesMd from './SitebarBestPractices.md';

export { Default } from './SitebarDefault.stories';
export { WithCta } from './SitebarWithCta.stories';
export { Xsmall } from './SitebarXsmall.stories';
export { Scrolled } from './SitebarScrolled.stories';

export default {
  title: 'Components/Sitebar',
  component: Sitebar,
  decorators: [moduleMetadata({ imports: [Sitebar, Button] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, height: '120px' },
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Sitebar>;
