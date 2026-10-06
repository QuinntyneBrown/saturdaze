import type { StoryObj } from '@storybook/angular';

import type { Dialog } from 'components';

export const Confirmation: StoryObj<Dialog> = {
  render: () => ({
    template: `
      <sd-dialog static title="Sign out?" subtitle="Your family and weekends stay saved.">
        <sd-button slot="actions" variant="quiet" type="button">Stay signed in</sd-button>
        <sd-button slot="actions" variant="danger" type="button"><sd-icon name="sign_out" />Sign out</sd-button>
      </sd-dialog>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'A confirmation needs no body: the title asks, the subtitle states the consequence, the buttons answer. Sign out uses the danger fill.',
      },
    },
  },
};
