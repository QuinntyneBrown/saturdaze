import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Block, Button, Chip, Icon } from 'components';

import descriptionMd from './BlockDescription.md';
import bestPracticesMd from './BlockBestPractices.md';

export { Default } from './BlockDefault.stories';
export { Kinds } from './BlockKinds.stories';
export { WithActions } from './BlockWithActions.stories';
export { Errand } from './BlockErrand.stories';
export { ReadOnly } from './BlockReadOnly.stories';

export default {
  title: 'Components/Block',
  component: Block,
  decorators: [moduleMetadata({ imports: [Block, Button, Chip, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Block>;
