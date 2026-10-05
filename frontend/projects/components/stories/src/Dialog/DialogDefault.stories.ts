import type { StoryObj } from '@storybook/angular';

import type { Dialog } from 'components';

export const Default: StoryObj<Dialog> = {
  args: {
    dialogTitle: 'Regenerate the weekend?',
    subtitle: 'Locked blocks stay where they are.',
    wide: false,
    closeLabel: 'Close',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-dialog static [title]="dialogTitle" [subtitle]="subtitle" [wide]="wide" [closeLabel]="closeLabel">
        <sd-well icon="lock" tone="accent" title="Keeping on Saturday">Swim 9:00 · Workout 5:00 · Bath and books 8:00</sd-well>
        <sd-button slot="actions" variant="quiet" type="button">Cancel</sd-button>
        <sd-button slot="actions" variant="primary" type="button"><sd-icon name="refresh" />Regenerate</sd-button>
      </sd-dialog>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Rendered inline with `static`. The `title` input is `dialogTitle` in the class (aliased to `title` in templates).',
      },
    },
  },
};
