import type { StoryObj } from '@storybook/angular';

import type { BottomNav } from 'components';

export const ChromeClearance: StoryObj<BottomNav> = {
  render: () => ({
    template: `
      <div style="--sd-chrome-bottom: 84px">
        <main class="sd-frame">
          <p class="sd-text-soft">
            <code>--sd-chrome-bottom</code> is 84px here, standing in for an expanded Safari toolbar. The nav lifts to
            12px above it; when the toolbar collapses the listener writes 0px and the nav settles back.
          </p>
        </main>
        <sd-bottom-nav active="ideas" />
        <div aria-hidden="true" style="position: fixed; inset: auto 0 0 0; height: 84px; background: repeating-linear-gradient(135deg, var(--colorNeutralBackground3) 0 8px, transparent 8px 16px); border-top: 1px dashed var(--colorNeutralStroke1)"></div>
      </div>
    `,
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story:
          'ADR-005: `bottom` takes the larger of the home-indicator inset and the measured bottom chrome, then adds a 12px floor. The hatched strip simulates the browser toolbar.',
      },
    },
  },
};
