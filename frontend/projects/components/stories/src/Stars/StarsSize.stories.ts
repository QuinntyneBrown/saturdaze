import type { StoryObj } from '@storybook/angular';

import type { Stars } from 'components';

export const Size: StoryObj<Stars> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 8px">
        <sd-stars [rating]="4" size="md" />
        <sd-stars [rating]="4" size="lg" />
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: '`md` draws 18px glyphs (cards); `lg` draws 24px glyphs (the rating dialog).' } },
  },
};
