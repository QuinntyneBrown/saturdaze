import type { StoryObj } from '@storybook/angular';

import type { TopBar } from 'components';

export const ActiveDestination: StoryObj<TopBar> = {
  render: () => ({
    props: { keys: ['weekend', 'ideas', 'past', 'family', null] },
    template: `
      <div style="display: grid; gap: 8px; padding-block: 8px">
        @for (key of keys; track $index) {
          <div><sd-top-bar [active]="key" email="quinn@saturdaze.app" /></div>
        }
      </div>
    `,
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      story: { height: '360px' },
      description: {
        story:
          'The active link gets `aria-current="page"` and the coral underline. `null` (the last bar) is for screens outside the four destinations.',
      },
    },
  },
};
