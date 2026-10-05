import type { StoryObj } from '@storybook/angular';

import { appShell } from '../shared/shell';
import { SATURDAY_DAY, SUNDAY_DAY, dayMarkup, weekendHeaderMarkup } from '../shared/weekend';

export const DesktopTopBar: StoryObj = {
  name: 'Desktop top bar',
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
          'From 1024px the days sit side by side under the sticky top bar; the bottom nav is `display: none`. The bar gains its blurred backdrop once the page scrolls.',
      },
    },
  },
};
