import type { StoryObj } from '@storybook/angular';

import type { Avatar } from 'components';

export const Size: StoryObj<Avatar> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-avatar name="Sara" tone="leaf" size="sm" />
        <sd-avatar name="Sara" tone="leaf" size="md" />
        <sd-avatar name="Sara" tone="leaf" size="lg" />
        <sd-avatar name="Sara" tone="leaf" size="xl" />
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: '`sm` 24px, `md` 28px, `lg` 32px (default), `xl` 36px.' } },
  },
};
