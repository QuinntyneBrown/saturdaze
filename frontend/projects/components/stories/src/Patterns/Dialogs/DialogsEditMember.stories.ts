import type { StoryObj } from '@storybook/angular';

import { specimen } from './dialogs';

export const EditMember: StoryObj = {
  name: 'Form with remove',
  render: () => ({
    template: specimen(`
      <sd-dialog static wide title="Edit Mae" subtitle="Ages shape the picks.">
        <form class="sd-stack" style="--gap: 14px" (submit)="$event.preventDefault()">
          <sd-text-input label="Name" name="memberName" required autocomplete="off" value="Mae" />
          <sd-text-input label="Age" name="memberAge" type="number" [min]="0" [max]="120" value="5" hint="Kid · picks favour ages 4 to 6." />
        </form>
        <sd-button slot="actions-left" variant="quiet" warnText><sd-icon name="trash" />Remove</sd-button>
        <sd-button slot="actions" variant="quiet">Cancel</sd-button>
        <sd-button slot="actions" variant="primary">Save</sd-button>
      </sd-dialog>
    `),
  }),
  globals: { viewport: { value: 'tablet' } },
  parameters: {
    docs: {
      description: {
        story:
          'Edit forms are `wide`. The destructive "Remove" sits in `[slot=actions-left]` as a warn-text quiet button and opens the destructive confirmation; Cancel and Save stay right.',
      },
    },
  },
};
