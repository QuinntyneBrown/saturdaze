import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { VoteRow } from 'components';

import descriptionMd from './VoteRowDescription.md';
import bestPracticesMd from './VoteRowBestPractices.md';

export { Default } from './VoteRowDefault.stories';
export { Interactive } from './VoteRowInteractive.stories';
export { Disabled } from './VoteRowDisabled.stories';

export default {
  title: 'Components/Vote Row',
  component: VoteRow,
  decorators: [moduleMetadata({ imports: [VoteRow] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<VoteRow>;
