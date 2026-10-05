import type { StoryObj } from '@storybook/angular';

import { specimen } from './dialogs';

export const SignOut: StoryObj = {
  name: 'Sign out confirmation',
  render: () => ({
    template: specimen(`
      <sd-dialog static title="Sign out?" subtitle="Your family and weekends stay saved.">
        <sd-button slot="actions" variant="quiet">Cancel</sd-button>
        <sd-button slot="actions" variant="danger"><sd-icon name="sign_out" />Sign out</sd-button>
      </sd-dialog>
    `),
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story: 'From the account menu or the Family screen. Ending the session is confirmed with a danger button; nothing is lost, and the subtitle says so.',
      },
    },
  },
};
