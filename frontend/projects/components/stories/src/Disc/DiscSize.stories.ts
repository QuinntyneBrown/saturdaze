import type { StoryObj } from '@storybook/angular';

import type { Disc } from 'components';

export const Size: StoryObj<Disc> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-disc icon="sparkle" tone="primary" size="sm" />
        <sd-disc icon="sparkle" tone="primary" size="md" />
        <sd-disc icon="sparkle" tone="primary" size="lg" />
        <sd-disc icon="sparkle" tone="primary" size="xl" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: '`sm` 32px, `md` 36px (default), `lg` 40px, `xl` 56px. The glyph scales with it: 16, 20, 20 and 26px.' },
    },
  },
};
