import type { StoryObj } from '@storybook/angular';

import { specimen } from './dialogs';

export const DestructiveDelete: StoryObj = {
  name: 'Destructive delete',
  render: () => ({
    template: specimen(`
      <sd-dialog static title="Remove Mae from the family?" subtitle="Future weekends will not plan for her.">
        <sd-button slot="actions" variant="quiet">Cancel</sd-button>
        <sd-button slot="actions" variant="danger"><sd-icon name="trash" />Remove</sd-button>
      </sd-dialog>
    `),
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'Irreversible removals name the thing in the title, say the consequence in one line, and confirm with `variant="danger"` plus the trash icon. Cancel stays first and quiet.',
      },
    },
  },
};
