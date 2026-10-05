import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { skeletonDayMarkup, weekendHeaderMarkup } from '../shared/weekend';

export const Generating: StoryObj = {
  name: 'Generating',
  render: () => ({
    template: appShell(
      'weekend',
      `
        ${weekendHeaderMarkup('This weekend', 'Sketching Saturday and Sunday. Usually four to six seconds.', { disabled: true })}
        <sd-status-row class="sd-mb-4" icon="sparkle">Working through your locks, the forecast and past weekends.</sd-status-row>
        <div class="sd-grid-days" aria-busy="true">
          ${skeletonDayMarkup('Saturday')}
          ${skeletonDayMarkup('Sunday')}
        </div>
      `,
    ),
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'While the planner runs: header actions disabled, an `sd-status-row` with the spinner disc explains what is happening, and each day shows `sd-skeleton-row`s with its actions hidden (`[actions]="false"`).',
      },
    },
  },
};
