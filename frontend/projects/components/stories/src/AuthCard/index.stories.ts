import { RouterLink } from '@angular/router';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AuthCard, Banner, Button, Disc, Icon, Spinner, TextInput, Toggle } from 'components';

import descriptionMd from './AuthCardDescription.md';
import bestPracticesMd from './AuthCardBestPractices.md';

export { Default } from './AuthCardDefault.stories';
export { WithError } from './AuthCardWithError.stories';
export { Centered } from './AuthCardCentered.stories';
export { Loading } from './AuthCardLoading.stories';

export default {
  title: 'Components/Auth Card',
  component: AuthCard,
  decorators: [
    moduleMetadata({
      imports: [AuthCard, Banner, Button, Disc, Icon, Spinner, TextInput, Toggle, RouterLink],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<AuthCard>;
