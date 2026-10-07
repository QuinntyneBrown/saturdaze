import type { StoryObj } from '@storybook/angular';

import type { Pager } from 'components';

export const MiddlePage: StoryObj<Pager> = {
  args: { page: 2, pageSize: 50, total: 120 },
  render: (args) => ({
    props: args,
    template: `<sd-pager style="max-width: 640px" [page]="page" [pageSize]="pageSize" [total]="total" (pageChange)="page = $event" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Both directions are open in the middle of a list; the text names the rows on screen ("51 to 100 of 120").',
      },
    },
  },
};
