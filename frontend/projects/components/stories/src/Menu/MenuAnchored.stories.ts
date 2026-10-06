import type { StoryObj } from '@storybook/angular';

import type { Menu } from 'components';

export const Anchored: StoryObj<Menu> = {
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
      <div style="min-height: 180px; display: flex; justify-content: flex-end">
        <div style="position: relative">
          <sd-button variant="quiet" icon label="More weekend options"><sd-icon name="more" /></sd-button>
          <sd-menu label="Weekend options" [items]="items" style="position: absolute; top: calc(100% + 8px); right: 0" />
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The Weekend "More" menu from 720px: a popover aligned to the trigger\'s end edge, 8px below. The popover hides `sub`; it only shows in the sheet. (Positioned statically here; see Open With Overlay for the live CDK version.)',
      },
    },
  },
};
