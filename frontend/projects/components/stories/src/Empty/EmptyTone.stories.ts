import type { StoryObj } from '@storybook/angular';

import type { Empty } from 'components';

export const Tone: StoryObj<Empty> = {
  render: () => ({
    template: `
      <div class="sd-grid-2">
        <sd-empty icon="check" tone="accent" title="Queue is clear" body="Approved events are already live on Ideas. Rejected ones are gone.">
          <sd-button slot="cta" variant="quiet" href="/family">
            <sd-icon slot="leading" name="arrow_left" />
            Back to Family
          </sd-button>
        </sd-empty>
        <sd-empty icon="ticket" tone="sun" title="No events this weekend" body="Nothing nearby fits your dates yet. Know of one? Suggest it and we'll review it." />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`icon` and `tone` set the extra-large disc. The review queue uses an accent check; an empty Events list a sun ticket. The CTA slot is optional.',
      },
    },
  },
};
