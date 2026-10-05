import type { StoryObj } from '@storybook/angular';

import type { Details } from 'components';

export const Default: StoryObj<Details> = {
  args: {
    items: [
      { label: 'Location', value: 'Memorial Park, Lakeshore Rd' },
      { label: 'Cost', value: 'Free' },
      { label: 'Ages', value: 'All ages' },
      { label: 'Notes', value: "Street performers along Lakeshore. The kids' zone runs 2 to 5, then it gets loud." },
    ],
    missing: 'Not given',
  },
  render: (args) => ({
    props: args,
    template: `<sd-details style="max-width: 520px" [items]="items" [missing]="missing" />`,
  }),
};
