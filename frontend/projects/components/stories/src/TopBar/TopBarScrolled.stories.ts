import type { StoryObj } from '@storybook/angular';

import type { TopBar } from 'components';

export const Scrolled: StoryObj<TopBar> = {
  render: () => ({
    props: { rows: Array.from({ length: 24 }, (_, i) => i + 1) },
    template: `
      <sd-top-bar active="ideas" email="quinn@saturdaze.app" />
      <main class="sd-frame">
        <p class="sd-text-soft sd-mb-4">Scroll this frame: the bar picks up its blurred backdrop and hairline once the window leaves the top.</p>
        <div class="sd-stack">
          @for (row of rows; track row) {
            <sd-card>Idea {{ row }}</sd-card>
          }
        </div>
      </main>
    `,
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      story: { height: '420px' },
      description: {
        story:
          'The `Scrolled` host directive sets `data-scrolled` once `window.scrollY > 4`; the bar then turns translucent with a `backdrop-filter` blur and a bottom hairline.',
      },
    },
  },
};
