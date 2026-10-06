import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { FAMILY_PAGE, FAMILY_STYLES } from './family';

export const Overview: StoryObj = {
  render: () => ({
    styles: FAMILY_STYLES,
    template: appShell('family', FAMILY_PAGE),
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'Two columns from 1024px: people and commitments on the left, home, likes, preference toggles, admin and account on the right. Toggles are live — flip one.',
      },
    },
  },
};
