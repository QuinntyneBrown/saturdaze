import type { StoryObj } from '@storybook/angular';

import type { Scrolled } from 'components';

export const HostDirective: StoryObj<Scrolled> = {
  render: () => ({
    props: { rows: Array.from({ length: 16 }, (_, i) => i + 1) },
    template: `
      <sd-top-bar active="weekend" email="quinn@saturdaze.app" />
      <main class="sd-frame">
        <div class="sd-stack">
          @for (row of rows; track row) {
            <sd-card>Block {{ row }}</sd-card>
          }
        </div>
      </main>
    `,
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          '`sd-top-bar` (and `sd-sitebar`) declare `hostDirectives: [Scrolled]`; nothing in the page template is needed. Scroll to see the bar pick up its backdrop.',
      },
    },
  },
};
