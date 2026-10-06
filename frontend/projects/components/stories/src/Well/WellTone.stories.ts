import type { StoryObj } from '@storybook/angular';

import type { Well } from 'components';

export const Tone: StoryObj<Well> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 12px; max-width: 420px">
        <sd-well title="Why this">Eli loves animals and the zoo is quiet before 11.</sd-well>
        <sd-well icon="lock" tone="accent" title="Locked">Saturday stays as it is when you regenerate the weekend.</sd-well>
        <sd-well icon="star" tone="primary" title="Tip">Rate last weekend and next Saturday gets a little better.</sd-well>
        <sd-well icon="rain" tone="warn" title="Showers after 3pm">We moved the bike ride to the morning. Pack rain jackets just in case.</sd-well>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`default` explains a pick, `accent` marks locked days and commitments, `primary` offers a tip and `warn` flags something to double-check.',
      },
    },
  },
};
