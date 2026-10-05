import type { StoryObj } from '@storybook/angular';

import type { Icon } from 'components';

export const Filled: StoryObj<Icon> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center">
        <sd-icon name="star" [size]="24" />
        <sd-icon name="star" [size]="24" filled style="color: var(--sd-sun)" />
        <sd-icon name="heart" [size]="24" />
        <sd-icon name="heart" [size]="24" filled style="color: var(--sd-primary)" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: '`filled` swaps the outline for a solid glyph — rated stars and the saved favourite heart.' },
    },
  },
};
