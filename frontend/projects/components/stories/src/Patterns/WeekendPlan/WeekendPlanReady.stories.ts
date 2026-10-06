import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { SATURDAY_DAY, SUNDAY_DAY, dayMarkup, weekendHeaderMarkup } from '../shared/weekend';

export const Ready: StoryObj = {
  name: 'Saturday | Sunday',
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
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'A planned weekend. Commitments (Swim, Workout, Church) carry the accent rail, drives are compact connectors, the Costco run is an errand with a done check, and "Bath and books" is a block the family locked.',
      },
    },
  },
};
