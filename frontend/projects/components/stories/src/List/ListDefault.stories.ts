import type { StoryObj } from '@storybook/angular';

import type { List } from 'components';

export const Default: StoryObj<List> = {
  args: {
    card: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-list style="max-width: 420px" [card]="card">
        <sd-list-item title="Swim lessons" subtitle="Saturdays · 9:00 to 10:00" chevron action>
          <sd-disc slot="leading" icon="lock" tone="accent" />
        </sd-list-item>
        <sd-list-item title="Church" subtitle="Sundays · 10:30 to 11:45" chevron action>
          <sd-disc slot="leading" icon="lock" tone="accent" />
        </sd-list-item>
        <sd-list-item title="Workout window" subtitle="Saturdays · 5:00 to 6:00pm" chevron action>
          <sd-disc slot="leading" icon="lock" tone="accent" />
        </sd-list-item>
      </sd-list>
    `,
  }),
};
