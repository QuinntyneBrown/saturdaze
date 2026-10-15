import type { StoryObj } from '@storybook/angular';

import type { ErrorSummary } from 'components';

export const Default: StoryObj<ErrorSummary> = {
  args: {
    problems: [
      { id: 'title', message: 'Enter a title for the event' },
      { id: 'link', message: 'Enter a link that starts with https://' },
    ],
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
