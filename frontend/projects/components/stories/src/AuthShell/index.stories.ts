import { RouterLink } from '@angular/router';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AuthCard, AuthShell, Button, Disc, Icon, TextInput } from 'components';

import descriptionMd from './AuthShellDescription.md';
import bestPracticesMd from './AuthShellBestPractices.md';

export { Default } from './AuthShellDefault.stories';
export { Stack } from './AuthShellStack.stories';
export { Mobile } from './AuthShellMobile.stories';

export default {
  title: 'Components/Auth Shell',
  component: AuthShell,
  decorators: [
    moduleMetadata({ imports: [AuthShell, AuthCard, Button, Disc, Icon, TextInput, RouterLink] }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      // min-height: 100svh — an iframe per story keeps it to the frame.
      story: { inline: false, height: '640px' },
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<AuthShell>;
