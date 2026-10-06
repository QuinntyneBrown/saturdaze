import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { GhostRow } from 'components';

import descriptionMd from './GhostRowDescription.md';
import bestPracticesMd from './GhostRowBestPractices.md';

export { Default } from './GhostRowDefault.stories';
export { WithIcon } from './GhostRowWithIcon.stories';
export { UnderAList } from './GhostRowUnderAList.stories';
export { AsLink } from './GhostRowAsLink.stories';

export default {
  title: 'Components/Ghost Row',
  component: GhostRow,
  decorators: [moduleMetadata({ imports: [GhostRow] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<GhostRow>;
