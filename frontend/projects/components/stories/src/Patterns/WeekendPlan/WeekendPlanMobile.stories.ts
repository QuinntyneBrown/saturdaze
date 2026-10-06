import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { SATURDAY_DAY, SUNDAY_DAY, dayMarkup, weekendHeaderMarkup } from '../shared/weekend';

export const Mobile: StoryObj = {
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
          'On phones the days stack, day headers stick while their blocks scroll and the day buttons collapse to icons. In the header, Share spans the row with Add to calendar under it and More sits beside the title.',
      },
    },
  },
};
