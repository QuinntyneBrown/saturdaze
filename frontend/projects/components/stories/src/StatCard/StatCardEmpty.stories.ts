import type { StoryObj } from '@storybook/angular';

import type { StatCard } from 'components';

/** A catalog with nothing in it: 0 of 0, an empty bar and the flag lines all at zero. */
export const Empty: StoryObj<StatCard> = {
  args: {
    label: 'Upcoming events',
    figure: 0,
    total: 0,
    tone: 'sky',
    links: [
      { count: 0, label: 'without a photo', href: '#' },
      { count: 0, label: 'blocked URL', href: '#' },
      { count: 0, label: 'unreviewed provider photo', href: '#' },
      { count: 0, label: 'missing alt text', href: '#' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `<sd-stat-card style="max-width: 360px" [label]="label" [figure]="figure" [total]="total" [tone]="tone" [links]="links" />`,
  }),
};
