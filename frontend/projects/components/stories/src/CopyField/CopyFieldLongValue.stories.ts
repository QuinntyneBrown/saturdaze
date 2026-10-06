import type { StoryObj } from '@storybook/angular';

import type { CopyField } from 'components';

export const LongValue: StoryObj<CopyField> = {
  render: () => ({
    template: `
      <div style="max-width: 320px; display: grid; gap: 8px">
        <sd-copy-field value="https://saturdaze.app/sample-weekend?share=7f3c9a2e-4b1d-4e8a-9c55-0d2f6a1b3e77" />
        <p class="sd-text-xs sd-text-soft">Read-only · expires in 7 days</p>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'At phone width a long link stays on one line and truncates with an ellipsis; the Copy button never wraps or shrinks.' },
    },
  },
};
