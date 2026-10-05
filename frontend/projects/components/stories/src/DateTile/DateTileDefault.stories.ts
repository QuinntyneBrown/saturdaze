import type { StoryObj } from '@storybook/angular';

import type { DateTile } from 'components';

export const Default: StoryObj<DateTile> = {
  args: {
    date: '2026-10-10',
    mon: '',
    day: '',
  },
  render: (args) => ({
    props: args,
    template: `<sd-date-tile [date]="date" [mon]="mon" [day]="day" />`,
  }),
};
