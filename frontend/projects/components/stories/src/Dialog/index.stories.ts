import { ReactiveFormsModule } from '@angular/forms';
import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, CopyField, Dialog, Icon, Media, TextInput, Well } from 'components';

import descriptionMd from './DialogDescription.md';
import bestPracticesMd from './DialogBestPractices.md';

export { Default } from './DialogDefault.stories';
export { Confirmation } from './DialogConfirmation.stories';
export { Destructive } from './DialogDestructive.stories';
export { Form } from './DialogForm.stories';
export { Share } from './DialogShare.stories';
export { WithMedia } from './DialogWithMedia.stories';
export { OpenWithCdk } from './DialogOpenWithCdk.stories';

export default {
  title: 'Components/Dialog',
  component: Dialog,
  decorators: [
    moduleMetadata({
      imports: [Dialog, Button, Icon, Media, Well, TextInput, CopyField, ReactiveFormsModule],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Dialog>;
