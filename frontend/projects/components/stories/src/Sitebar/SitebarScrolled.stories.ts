import type { StoryObj } from '@storybook/angular';

import type { Sitebar } from 'components';

export const Scrolled: StoryObj<Sitebar> = {
  render: () => ({
    props: { rows: Array.from({ length: 10 }, (_, i) => i + 1) },
    template: `
      <sd-sitebar cta />
      <main class="sd-frame sd-frame--site">
        <div class="sd-stack sd-narrow">
          @for (row of rows; track row) {
            <p>
              Section {{ row }}. Saturdaze drafts Saturday and Sunday around swim lessons, church and the weather,
              then fills the rest with things your family will say yes to. Scroll to see the bar pick up its backdrop.
            </p>
          }
        </div>
      </main>
    `,
  }),
  parameters: {
    docs: {
      story: { height: '360px' },
      description: { story: 'Over scrolled content the bar turns translucent with a blur and a hairline (`[data-scrolled]`).' },
    },
  },
};
