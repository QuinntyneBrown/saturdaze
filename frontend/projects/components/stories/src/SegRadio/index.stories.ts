import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { SegRadio, TextInput } from 'components';

import descriptionMd from './SegRadioDescription.md';
import bestPracticesMd from './SegRadioBestPractices.md';

export { Default } from './SegRadioDefault.stories';
export { TwoOptions } from './SegRadioTwoOptions.stories';
export { Disabled } from './SegRadioDisabled.stories';
export { ReactiveForms } from './SegRadioReactiveForms.stories';

export default {
  title: 'Components/Seg Radio',
  component: SegRadio,
  decorators: [moduleMetadata({ imports: [SegRadio, TextInput, ReactiveFormsModule, JsonPipe] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<SegRadio>;
