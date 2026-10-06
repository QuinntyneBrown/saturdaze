import type { StoryObj } from '@storybook/angular';

import type { Details } from 'components';

export const InCard: StoryObj<Details> = {
  render: () => ({
    props: {
      items: [
        { label: 'Location', value: 'Memorial Park, Lakeshore Rd' },
        { label: 'Cost', value: 'Free' },
        { label: 'Ages', value: 'All ages' },
        {
          label: 'Link',
          value: 'example.com/port-credit-buskerfest-2026',
          href: 'https://example.com/port-credit-buskerfest-2026',
        },
        { label: 'Notes', value: "Street performers along Lakeshore. The kids' zone runs 2 to 5, then it gets loud." },
      ],
    },
    template: `
      <sd-card padding="lg" style="max-width: 560px">
        <div class="sd-cluster sd-cluster--between">
          <strong>Port Credit Buskerfest</strong>
          <sd-chip tone="sun">Pending</sd-chip>
        </div>
        <span class="sd-text-sm sd-text-soft">Sat 20 Jun · 2:00 to 9:00pm</span>
        <sd-details [items]="items" />
        <div class="sd-cluster sd-cluster--end">
          <sd-button variant="quiet"><sd-icon name="close" />Reject</sd-button>
          <sd-button><sd-icon name="check" />Approve</sd-button>
        </div>
      </sd-card>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'In context: a submission card in the review queue, with the details between the card head and the review actions.' },
    },
  },
};
