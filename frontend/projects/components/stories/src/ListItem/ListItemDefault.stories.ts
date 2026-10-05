import type { StoryObj } from '@storybook/angular';

import type { ListItem } from 'components';

export const Default: StoryObj<ListItem> = {
  args: {
    rowTitle: 'Swim lessons',
    subtitle: 'Saturdays · 9:00 to 10:00',
    subtitleFirst: false,
    chevron: true,
    action: true,
    label: '',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-list card style="max-width: 420px">
        <sd-list-item
          [title]="rowTitle"
          [subtitle]="subtitle"
          [subtitleFirst]="subtitleFirst"
          [chevron]="chevron"
          [action]="action"
          [label]="label"
        >
          <sd-disc slot="leading" icon="lock" tone="accent" />
        </sd-list-item>
      </sd-list>
    `,
  }),
};
