import type { StoryObj } from '@storybook/angular';

import type { Dialog } from 'components';

export const Share: StoryObj<Dialog> = {
  render: () => ({
    template: `
      <sd-dialog static title="Share this weekend" subtitle="Anyone with the link can view it. Nobody can edit.">
        <sd-copy-field value="https://saturdaze.app/sample-weekend?share=7f3c9a2e" />
        <p class="sd-text-xs sd-text-soft">Read-only · expires in 7 days</p>
        <sd-button slot="actions" variant="primary" type="button">Done</sd-button>
      </sd-dialog>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'An informational dialog has a single primary action. The body can hold any component — here `sd-copy-field`.' },
    },
  },
};
