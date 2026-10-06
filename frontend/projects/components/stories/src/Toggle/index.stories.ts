import { JsonPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { List, ListItem, TextInput, Toggle } from 'components';

import descriptionMd from './ToggleDescription.md';
import bestPracticesMd from './ToggleBestPractices.md';

export { Default } from './ToggleDefault.stories';
export { WithoutLabel } from './ToggleWithoutLabel.stories';
export { Disabled } from './ToggleDisabled.stories';
export { ReactiveForms } from './ToggleReactiveForms.stories';

export default {
  title: 'Components/Toggle',
  component: Toggle,
  decorators: [moduleMetadata({ imports: [Toggle, List, ListItem, TextInput, FormsModule, ReactiveFormsModule, RouterLink, JsonPipe] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Toggle>;
