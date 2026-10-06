import type { StoryObj } from '@storybook/angular';

import type { Chip } from 'components';

export const WithIcon: StoryObj<Chip> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center">
        <sd-chip tone="sky"><sd-icon name="sun" [stroke]="2" />22°</sd-chip>
        <sd-chip tone="sky"><sd-icon name="rain" [stroke]="2" />Showers after 3pm</sd-chip>
        <sd-chip tone="accent"><sd-icon name="lock" [stroke]="2" />Locked</sd-chip>
        <sd-chip tone="leaf"><sd-icon name="car" [stroke]="2" />15 min drive</sd-chip>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Project an `sd-icon` before the text; the chip sizes it to 13px. Use `stroke="2"` so the small glyph stays crisp.',
      },
    },
  },
};
