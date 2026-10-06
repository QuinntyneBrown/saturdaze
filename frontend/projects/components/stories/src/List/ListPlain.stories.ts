import type { StoryObj } from '@storybook/angular';

import type { List } from 'components';

export const Plain: StoryObj<List> = {
  render: () => ({
    template: `
      <sd-card style="max-width: 420px">
        <sd-list>
          <sd-list-item title="Sat 17 May · 9:00" subtitle="Swim lessons">
            <sd-disc slot="leading" icon="calendar" size="sm" />
          </sd-list-item>
          <sd-list-item title="Sat 17 May · 11:00" subtitle="Lavender fields at Terre Bleu">
            <sd-disc slot="leading" icon="tree" tone="leaf" size="sm" />
          </sd-list-item>
          <sd-list-item title="Sun 18 May · 14:30" subtitle="The Rec Room">
            <sd-disc slot="leading" icon="popcorn" tone="indoor" size="sm" />
          </sd-list-item>
        </sd-list>
      </sd-card>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Without `card` the list adds no surface — use it when the rows already sit inside a card or a dialog.',
      },
    },
  },
};
