import { FormsModule } from '@angular/forms';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Strength, TextInput } from 'components';

import descriptionMd from './StrengthDescription.md';
import bestPracticesMd from './StrengthBestPractices.md';

export { Default } from './StrengthDefault.stories';
export { Level } from './StrengthLevel.stories';
export { WithPassword } from './StrengthWithPassword.stories';

export default {
  title: 'Components/Strength',
  component: Strength,
  decorators: [moduleMetadata({ imports: [Strength, TextInput, FormsModule] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Strength>;
