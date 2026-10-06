import type { StoryObj } from '@storybook/angular';

import type { GhostRow } from 'components';

export const AsLink: StoryObj<GhostRow> = {
  render: () => ({
    template: `
      <div style="max-width: 420px">
        <sd-ghost-row href="/family">Add a family member</sd-ghost-row>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'With `href` it renders an `<a class="ghost-row">`; plain clicks on in-app paths go through the Angular router instead of reloading.',
      },
    },
  },
};
