import type { StoryObj } from '@storybook/angular';

import type { List } from 'components';

export const WithGhostRow: StoryObj<List> = {
  render: () => ({
    template: `
      <div style="max-width: 420px">
        <sd-list card>
          <sd-list-item title="Quinn" subtitle="Parent · 38" action chevron>
            <sd-avatar slot="leading" name="Quinn" tone="primary" size="lg" />
          </sd-list-item>
          <sd-list-item title="Sara" subtitle="Parent · 36" action chevron>
            <sd-avatar slot="leading" name="Sara" tone="leaf" size="lg" />
          </sd-list-item>
          <sd-list-item title="Eli" subtitle="Kid · 9" action chevron>
            <sd-avatar slot="leading" name="Eli" tone="sky" size="lg" />
          </sd-list-item>
          <sd-list-item title="Mae" subtitle="Kid · 5" action chevron>
            <sd-avatar slot="leading" name="Mae" tone="sun" size="lg" />
          </sd-list-item>
        </sd-list>
        <sd-ghost-row icon="plus">Add a family member</sd-ghost-row>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Family\'s "Who\'s in": avatar rows that open the member dialog, with the dashed add row below the list.',
      },
    },
  },
};
