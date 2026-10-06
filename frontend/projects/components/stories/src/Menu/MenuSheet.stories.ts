import type { StoryObj } from '@storybook/angular';

import type { Menu } from 'components';

export const Sheet: StoryObj<Menu> = {
  render: () => ({
    props: {
      items: [
        {
          id: 'regenerate',
          label: 'Regenerate the weekend',
          icon: 'refresh',
          sub: 'Locked blocks stay where they are',
        },
        {
          id: 'calendar',
          label: 'Add to calendar',
          icon: 'calendar',
          sub: 'One .ics with both days',
        },
      ],
    },
    template: `
      <div style="max-width: 390px">
        <sd-dialog static title="Weekend options">
          <sd-menu sheet label="Weekend options" [items]="items" />
          <sd-button slot="actions" variant="quiet" type="button">Close</sd-button>
        </sd-dialog>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Below 720px the same items render with `sheet` inside an `sd-dialog` bottom sheet: full-width rows with an `sd-disc` icon and the `sub` line, and a quiet Close action.',
      },
    },
  },
};
