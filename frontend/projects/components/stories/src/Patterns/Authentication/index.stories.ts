import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { AuthCard, AuthShell, Banner, Button, Checkbox, Disc, Icon, Strength, TextInput, Toggle } from 'components';

import descriptionMd from './AuthenticationDescription.md';

export { SignIn } from './AuthenticationSignIn.stories';
export { SignInError } from './AuthenticationSignInError.stories';
export { CreateAccount } from './AuthenticationCreateAccount.stories';
export { CheckEmail } from './AuthenticationCheckEmail.stories';
export { LinkExpired } from './AuthenticationLinkExpired.stories';

export default {
  title: 'Patterns/Authentication',
  decorators: [
    moduleMetadata({
      imports: [AuthShell, AuthCard, Banner, Button, Checkbox, Disc, Icon, Strength, TextInput, Toggle, FormsModule, RouterLink],
    }),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, height: '760px' },
      description: {
        component: descriptionMd,
      },
    },
  },
} as Meta;
