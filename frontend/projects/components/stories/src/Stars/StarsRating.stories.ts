import type { StoryObj } from '@storybook/angular';

import type { Stars } from 'components';

export const Rating: StoryObj<Stars> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 8px">
        <sd-stars [rating]="5" label="5 of 5" />
        <sd-stars [rating]="3" label="3 of 5" />
        <sd-stars [rating]="1" label="1 of 5" />
        <sd-stars label="Rate it" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: { story: 'Stars fill up to `rating`; `label` adds a caption. An unrated weekend shows five empty stars and "Rate it".' },
    },
  },
};
