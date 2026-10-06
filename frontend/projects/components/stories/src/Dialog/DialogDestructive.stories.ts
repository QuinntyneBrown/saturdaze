import type { StoryObj } from '@storybook/angular';

import type { Dialog } from 'components';

export const Destructive: StoryObj<Dialog> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 24px">
        <sd-dialog static title="Remove Mae from the family?" subtitle="Future weekends will not plan for her.">
          <sd-button slot="actions" variant="quiet" type="button">Cancel</sd-button>
          <sd-button slot="actions" variant="danger" type="button"><sd-icon name="trash" />Remove</sd-button>
        </sd-dialog>
        <sd-dialog static title="Use this weekend again?" subtitle="It replaces the current draft. Saved weekends stay.">
          <sd-well icon="refresh" tone="warn" title="The lavender weekend draft goes away">Locks and family settings stay.</sd-well>
          <sd-button slot="actions" variant="quiet" type="button">Cancel</sd-button>
          <sd-button slot="actions" variant="danger" type="button">Replace draft</sd-button>
        </sd-dialog>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Irreversible work confirms with a `danger` button named for the action. A `warn` well in the body spells out what is lost and what stays.',
      },
    },
  },
};
