import { JsonPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Checkbox } from 'components';

import descriptionMd from './CheckboxDescription.md';
import bestPracticesMd from './CheckboxBestPractices.md';

export { Default } from './CheckboxDefault.stories';
export { WithLinks } from './CheckboxWithLinks.stories';
export { Disabled } from './CheckboxDisabled.stories';
export { ReactiveForms } from './CheckboxReactiveForms.stories';

export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  decorators: [
    moduleMetadata({ imports: [Checkbox, Button, ReactiveFormsModule, RouterLink, JsonPipe] }),
  ],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Checkbox>;
