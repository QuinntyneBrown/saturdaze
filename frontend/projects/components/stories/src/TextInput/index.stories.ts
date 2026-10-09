import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { TextInput } from 'components';

import descriptionMd from './TextInputDescription.md';
import bestPracticesMd from './TextInputBestPractices.md';

export { Default } from './TextInputDefault.stories';
export { Hint } from './TextInputHint.stories';
export { Invalid } from './TextInputInvalid.stories';
export { Type } from './TextInputType.stories';
export { Multiline } from './TextInputMultiline.stories';
export { Code } from './TextInputCode.stories';
export { ReadonlyAndDisabled } from './TextInputReadonlyDisabled.stories';
export { ReactiveForms } from './TextInputReactiveForms.stories';

export default {
  title: 'Components/Text Input',
  component: TextInput,
  decorators: [moduleMetadata({ imports: [TextInput, ReactiveFormsModule, JsonPipe] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<TextInput>;
