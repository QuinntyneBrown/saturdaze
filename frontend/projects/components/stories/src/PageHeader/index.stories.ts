import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Icon, PageHeader } from 'components';

import descriptionMd from './PageHeaderDescription.md';
import bestPracticesMd from './PageHeaderBestPractices.md';

export { Default } from './PageHeaderDefault.stories';
export { WithActions } from './PageHeaderWithActions.stories';
export { BackLink } from './PageHeaderBackLink.stories';
export { TitleOnly } from './PageHeaderTitleOnly.stories';

export default {
  title: 'Components/Page Header',
  component: PageHeader,
  decorators: [moduleMetadata({ imports: [PageHeader, Button, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<PageHeader>;
