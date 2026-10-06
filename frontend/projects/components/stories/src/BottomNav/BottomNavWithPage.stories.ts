import type { StoryObj } from '@storybook/angular';

import type { BottomNav } from 'components';

export const WithPage: StoryObj<BottomNav> = {
  render: () => ({
    props: { rows: Array.from({ length: 12 }, (_, i) => i + 1) },
    template: `
      <main class="sd-frame">
        <div class="sd-stack">
          @for (row of rows; track row) {
            <sd-card>Past weekend {{ row }}</sd-card>
          }
          <p class="sd-text-soft sd-text-sm">End of the list: the frame's bottom padding keeps this line clear of the nav.</p>
        </div>
      </main>
      <sd-bottom-nav active="past" />
    `,
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story:
          'Inside the app shell: `.sd-frame` pads its bottom by the nav height plus the safe-area inset, so scrolled-to-end content clears the floating pill.',
      },
    },
  },
};
