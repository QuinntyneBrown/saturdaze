import type { StoryObj } from '@storybook/angular';

import type { Pager } from 'components';

export const Empty: StoryObj<Pager> = {
  args: { page: 1, pageSize: 50, total: 0, emptyText: 'No changes' },
  render: (args) => ({
    props: args,
    template: `<sd-pager style="max-width: 640px" [page]="page" [pageSize]="pageSize" [total]="total" [emptyText]="emptyText" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'With nothing to page, `emptyText` replaces the range and both buttons are disabled.',
      },
    },
  },
};
