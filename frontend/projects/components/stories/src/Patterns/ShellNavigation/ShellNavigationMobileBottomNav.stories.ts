import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { SATURDAY_DAY, SUNDAY_DAY, dayMarkup, weekendHeaderMarkup } from '../shared/weekend';

export const MobileBottomNav: StoryObj = {
  name: 'Mobile bottom navigation',
  render: () => ({
    template: appShell(
      'weekend',
      `
        ${weekendHeaderMarkup('This weekend', 'Sunny Saturday for the lavender, a cloudy Sunday for the Rec Room.')}
        <div class="sd-grid-days">
          ${dayMarkup(SATURDAY_DAY)}
          ${dayMarkup(SUNDAY_DAY)}
        </div>
      `,
    ),
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story:
          'At 390px the top bar is hidden and the pill floats 12px above the bottom edge (or above the home indicator / Safari toolbar). Scroll to the end: the last block and the "Add an errand" row clear the nav.',
      },
    },
  },
};
