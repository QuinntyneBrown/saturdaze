import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { CopyField } from 'components';

import descriptionMd from './CopyFieldDescription.md';
import bestPracticesMd from './CopyFieldBestPractices.md';

export { Default } from './CopyFieldDefault.stories';
export { Copied } from './CopyFieldCopied.stories';
export { LongValue } from './CopyFieldLongValue.stories';

export default {
  title: 'Components/Copy Field',
  component: CopyField,
  decorators: [moduleMetadata({ imports: [CopyField] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<CopyField>;
