import type { StoryObj } from '@storybook/angular';

import type { ErrorSummary } from 'components';

export const SingleProblem: StoryObj<ErrorSummary> = {
  args: {
    problems: [{ id: 'title', message: 'Enter a title for the event' }],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width: 420px">
        <sd-error-summary [problems]="problems" />
      </div>
    `,
  }),
};
