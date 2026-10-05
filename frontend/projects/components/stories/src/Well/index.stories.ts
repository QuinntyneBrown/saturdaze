import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Well } from 'components';

import descriptionMd from './WellDescription.md';
import bestPracticesMd from './WellBestPractices.md';

export { Default } from './WellDefault.stories';
export { Tone } from './WellTone.stories';
export { BodyOnly } from './WellBodyOnly.stories';

export default {
  title: 'Components/Well',
  component: Well,
  decorators: [moduleMetadata({ imports: [Well] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Well>;
