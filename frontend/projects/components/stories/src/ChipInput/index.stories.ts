import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { ChipInput } from 'components';

import descriptionMd from './ChipInputDescription.md';
import bestPracticesMd from './ChipInputBestPractices.md';

export { Default } from './ChipInputDefault.stories';
export { LikesAndDislikes } from './ChipInputLikesAndDislikes.stories';
export { Empty } from './ChipInputEmpty.stories';
export { Disabled } from './ChipInputDisabled.stories';

export default {
  title: 'Components/Chip Input',
  component: ChipInput,
  decorators: [moduleMetadata({ imports: [ChipInput, ReactiveFormsModule, JsonPipe] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<ChipInput>;
