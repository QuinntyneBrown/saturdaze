import type { StoryObj } from '@storybook/angular';

import { specimen } from './dialogs';

export const MobileSheet: StoryObj = {
  name: 'Phone bottom sheet',
  render: () => ({
    template: specimen(`
      <sd-dialog static title="Sign out?" subtitle="Your family and weekends stay saved.">
        <sd-button slot="actions" variant="quiet">Cancel</sd-button>
        <sd-button slot="actions" variant="danger"><sd-icon name="sign_out" />Sign out</sd-button>
      </sd-dialog>
    `),
  }),
  globals: { viewport: { value: 'mobile' } },
  parameters: {
    docs: {
      description: {
        story:
          'Below 720px the panel takes the sheet shape (grip, rounded top corners) and the actions stack full width with the primary on top.',
      },
    },
  },
};
