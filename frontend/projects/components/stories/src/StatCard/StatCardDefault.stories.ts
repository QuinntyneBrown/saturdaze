import type { StoryObj } from '@storybook/angular';

import type { StatCard } from 'components';

export const Default: StoryObj<StatCard> = {
  args: {
    label: 'Activities',
    figure: 16,
    total: 20,
    tone: 'leaf',
    links: [
      { count: 4, label: 'without a photo', href: '#' },
      { count: 1, label: 'blocked URL', href: '#' },
      { count: 3, label: 'unreviewed provider photo', href: '#' },
      { count: 2, label: 'missing alt text', href: '#' },
    ],
  },
  render: (args) => ({
    props: args,
    template: `<sd-stat-card style="max-width: 360px" [label]="label" [figure]="figure" [total]="total" [tone]="tone" [links]="links" />`,
  }),
};
