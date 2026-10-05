import type { StoryObj } from '@storybook/angular';

import type { Empty } from 'components';

export const Warm: StoryObj<Empty> = {
  render: () => ({
    template: `
      <div class="sd-narrow">
        <sd-empty
          warm
          icon="sparkle"
          tone="primary"
          title="Saturday and Sunday, drafted around The Browns"
          body="Your commitments stay put. Everything else gets planned around the weather and what the kids like."
          note="Or wait for Friday at 6pm."
        >
          <sd-button slot="cta" variant="primary" size="lg">
            <sd-icon name="sparkle" />
            Plan this weekend
          </sd-button>
        </sd-empty>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '`warm` (`.empty--warm`) is the brand-gradient first run on the Weekend screen. `note` sits faint under the call to action.',
      },
    },
  },
};
