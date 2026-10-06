import type { Meta } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

import { Button, Icon, Tooltip } from 'components';

import descriptionMd from './TooltipDescription.md';
import bestPracticesMd from './TooltipBestPractices.md';

export { Default } from './TooltipDefault.stories';
export { IconButtons } from './TooltipIconButtons.stories';
export { WithVisibleText } from './TooltipWithVisibleText.stories';
export { Placement } from './TooltipPlacement.stories';

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  decorators: [moduleMetadata({ imports: [Tooltip, Button, Icon] })],
  parameters: {
    docs: {
      description: {
        component: [descriptionMd, bestPracticesMd].join('\n'),
      },
    },
  },
} as Meta<Tooltip>;
