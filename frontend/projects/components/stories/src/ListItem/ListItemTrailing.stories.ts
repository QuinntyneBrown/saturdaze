import type { StoryObj } from '@storybook/angular';

import type { ListItem } from 'components';

export const Trailing: StoryObj<ListItem> = {
  render: () => ({
    template: `
      <sd-list card style="max-width: 420px">
        <sd-list-item title="Port Credit, Mississauga" subtitle="Drive times are measured from here">
          <sd-disc slot="leading" icon="pin" />
          <sd-button slot="trailing" variant="quiet" size="sm"><sd-icon name="edit" />Edit</sd-button>
        </sd-list-item>
        <sd-list-item title="Costco run" subtitle="Paper towels, bread, yogurt">
          <sd-disc slot="leading" icon="bag" tone="indoor" />
          <sd-chip slot="trailing" tone="indoor" size="sm">Errand</sd-chip>
        </sd-list-item>
      </sd-list>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Static rows (no `href`, no `action`) can carry one control or chip in `[slot=trailing]` — on Family the preference rows put an `sd-toggle` there.',
      },
    },
  },
};
