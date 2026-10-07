import type { StoryObj } from '@storybook/angular';

import type { Pager } from 'components';

export const Default: StoryObj<Pager> = {
  args: { page: 1, pageSize: 50, total: 120, emptyText: 'No places' },
  render: (args) => ({
    props: args,
    template: `
      <sd-pager style="max-width: 640px" [page]="page" [pageSize]="pageSize" [total]="total"
        [emptyText]="emptyText" (pageChange)="page = $event" />
    `,
  }),
};
