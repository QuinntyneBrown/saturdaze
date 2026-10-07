import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Select, TextInput, Toolbar } from 'components';

import descriptionMd from './ToolbarDescription.md';
import bestPracticesMd from './ToolbarBestPractices.md';

export { Default } from './ToolbarDefault.stories';
export { Fields } from './ToolbarFields.stories';

export default {
  title: 'Components/Toolbar',
  component: Toolbar,
  decorators: [moduleMetadata({ imports: [Toolbar, TextInput, Select] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Toolbar>;
