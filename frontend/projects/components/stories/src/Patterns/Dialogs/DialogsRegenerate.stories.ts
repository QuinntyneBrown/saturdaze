import type { StoryObj } from '@storybook/angular';

import { specimen } from './dialogs';

export const Regenerate: StoryObj = {
  name: 'Confirm with what is kept',
  render: () => ({
    template: specimen(`
      <sd-dialog static title="Regenerate the weekend?" subtitle="Locked blocks stay where they are.">
        <sd-well icon="lock" tone="accent" title="Keeping">Swim 9:00 · Church 10:30 · Workout 5:00 · Bath and books 8:00</sd-well>
        <sd-button slot="actions" variant="quiet">Cancel</sd-button>
        <sd-button slot="actions" variant="primary"><sd-icon name="refresh" />Regenerate</sd-button>
      </sd-dialog>
    `),
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'A non-destructive confirmation with an `sd-well` listing what survives. The confirm button is the coral primary.',
      },
    },
  },
};
