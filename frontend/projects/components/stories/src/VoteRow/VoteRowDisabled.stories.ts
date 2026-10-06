import type { StoryObj } from '@storybook/angular';

import type { VoteRow } from 'components';

export const Disabled: StoryObj<VoteRow> = {
  render: () => ({
    props: {
      votes: [
        { name: 'Quinn', tone: 'primary', vote: 'up' },
        { name: 'Sara', tone: 'leaf', vote: 'down' },
        { name: 'Eli', tone: 'sky', vote: 'up' },
        { name: 'Mae', tone: 'sun', vote: 'up' },
      ],
    },
    template: `<sd-vote-row style="max-width: 420px" disabled label="Family vote for The Sicilian Sidewalk Café" [votes]="votes" />`,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`disabled` turns every thumb off but keeps the votes visible — the siblings of a locked restaurant.',
      },
    },
  },
};
