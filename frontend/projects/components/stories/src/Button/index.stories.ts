import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Icon } from 'components';

import descriptionMd from './ButtonDescription.md';
import bestPracticesMd from './ButtonBestPractices.md';

export { Default } from './ButtonDefault.stories';
export { Variant } from './ButtonVariant.stories';
export { Size } from './ButtonSize.stories';
export { WithIcon } from './ButtonWithIcon.stories';
export { IconOnly } from './ButtonIconOnly.stories';
export { Full } from './ButtonFull.stories';
export { Toggle } from './ButtonToggle.stories';
export { Disabled } from './ButtonDisabled.stories';
export { AsLink } from './ButtonAsLink.stories';

export default {
  title: 'Components/Button',
  component: Button,
  decorators: [moduleMetadata({ imports: [Button, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Button>;
