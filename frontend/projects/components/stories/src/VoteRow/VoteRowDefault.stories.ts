import type { StoryObj } from '@storybook/angular';

import type { VoteRow } from 'components';

export const Default: StoryObj<VoteRow> = {
  args: {
    votes: [
      { name: 'Quinn', tone: 'primary', vote: 'up' },
      { name: 'Sara', tone: 'leaf', vote: 'up' },
      { name: 'Eli', tone: 'sky', vote: 'down' },
      { name: 'Mae', tone: 'sun', vote: 'none' },
    ],
    label: 'Family vote for La Marina',
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `<sd-vote-row style="max-width: 420px" [votes]="votes" [label]="label" [disabled]="disabled" />`,
  }),
};
