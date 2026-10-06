import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Select } from 'components';

import descriptionMd from './SelectDescription.md';
import bestPracticesMd from './SelectBestPractices.md';

export { Default } from './SelectDefault.stories';
export { Hint } from './SelectHint.stories';
export { Disabled } from './SelectDisabled.stories';
export { ReactiveForms } from './SelectReactiveForms.stories';

export default {
  title: 'Components/Select',
  component: Select,
  decorators: [moduleMetadata({ imports: [Select, ReactiveFormsModule, JsonPipe] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Select>;
