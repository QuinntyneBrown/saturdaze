import type { StoryObj } from '@storybook/angular';

import type { GhostRow } from 'components';

export const WithIcon: StoryObj<GhostRow> = {
  render: () => ({
    template: `
      <div style="max-width: 420px">
        <sd-ghost-row icon="bag">Add an errand</sd-ghost-row>
        <sd-ghost-row icon="user">Add a family member</sd-ghost-row>
      </div>
    `,
  }),
  parameters: {
    docs: { description: { story: '`icon` swaps the leading `plus` for a glyph that names the list — `bag` for errands, `user` for family.' } },
  },
};
