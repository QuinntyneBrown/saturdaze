import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, CopyField, Dialog, Icon, TextInput, Well } from 'components';

import descriptionMd from './DialogsDescription.md';

export { SignOut } from './DialogsSignOut.stories';
export { DestructiveDelete } from './DialogsDestructiveDelete.stories';
export { ShareLink } from './DialogsShareLink.stories';
export { Regenerate } from './DialogsRegenerate.stories';
export { EditMember } from './DialogsEditMember.stories';
export { MobileSheet } from './DialogsMobileSheet.stories';

export default {
  title: 'Patterns/Dialogs',
  decorators: [moduleMetadata({ imports: [Dialog, Button, Icon, CopyField, TextInput, Well] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, height: '480px' },
      description: {
        component: descriptionMd,
      },
    },
  },
} as Meta;
