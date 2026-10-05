import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { SATURDAY_DAY, SUNDAY_DAY, dayMarkup, weekendHeaderMarkup } from '../shared/weekend';

export const LockedDay: StoryObj = {
  name: 'Locked day',
  render: () => ({
    template: appShell(
      'weekend',
      `
        ${weekendHeaderMarkup('This weekend', 'Saturday is locked. Regenerating only touches Sunday.')}
        <div class="sd-grid-days">
          ${dayMarkup(SATURDAY_DAY, { locked: true })}
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
          'Saturday is locked: the day gets `.day--locked` and the "Day locked" chip, its Lock button reads "Unlock day" with `aria-pressed="true"`, and every plannable block is locked so a regenerate leaves it alone.',
      },
    },
  },
};
