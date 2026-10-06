import type { StoryObj } from '@storybook/angular';

import type { TopBar } from 'components';

export const Handoff: StoryObj<TopBar> = {
  name: 'Below 720px',
  render: () => ({
    template: `
      <sd-top-bar active="weekend" email="quinn@saturdaze.app" />
      <main class="sd-frame">
        <p class="sd-text-soft">Below 720px the top bar is hidden and the floating bottom nav carries the same four destinations.</p>
      </main>
      <sd-bottom-nav active="weekend" />
    `,
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      story: { height: '420px' },
      description: {
        story:
          'The shell renders both bars; CSS decides which one shows. On the docs page the frame is wider than 720px, so open the story canvas (Mobile viewport) to see the handoff.',
      },
    },
  },
};
