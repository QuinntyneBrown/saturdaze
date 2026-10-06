import type { StoryObj } from '@storybook/angular';

import type { Details } from 'components';

export const WithLink: StoryObj<Details> = {
  render: () => ({
    props: {
      items: [
        { label: 'Location', value: 'Memorial Park, Lakeshore Rd' },
        { label: 'Cost', value: 'Free' },
        {
          label: 'Link',
          value: 'example.com/port-credit-buskerfest-2026',
          href: 'https://example.com/port-credit-buskerfest-2026',
        },
      ],
    },
    template: `<sd-details style="max-width: 520px" [items]="items" />`,
  }),
  parameters: {
    docs: {
      description: { story: 'An item with `href` renders its value as an external `.details__link` with a trailing arrow, opening in a new tab.' },
    },
  },
};
