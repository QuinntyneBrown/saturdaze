import type { StoryObj } from '@storybook/angular';

import type { Details } from 'components';

export const MissingValues: StoryObj<Details> = {
  render: () => ({
    props: {
      items: [
        { label: 'Location', value: "St. Christopher's school, Port Credit" },
        { label: 'Cost', value: null },
        { label: 'Ages', value: 'All ages' },
        { label: 'Link', value: null },
        { label: 'Notes', value: 'Bake sale, bouncy castle and a silent auction in the gym.' },
      ],
    },
    template: `<sd-details style="max-width: 520px" [items]="items" />`,
  }),
  parameters: {
    docs: {
      description: { story: 'A `null` value renders the `missing` text ("Not given") in faint ink, so blank fields stay visible to the reviewer.' },
    },
  },
};
