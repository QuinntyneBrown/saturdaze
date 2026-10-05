import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { FAMILY_PAGE, FAMILY_STYLES } from './family';

export const Mobile: StoryObj = {
  render: () => ({
    styles: FAMILY_STYLES,
    template: appShell('family', FAMILY_PAGE),
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story: 'One column on phones, in reading order; the bottom nav highlights Family.',
      },
    },
  },
};
