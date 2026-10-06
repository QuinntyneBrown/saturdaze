import type { StoryObj } from '@storybook/angular';

import type { PageHeader } from 'components';

export const TitleOnly: StoryObj<PageHeader> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 32px">
        <sd-page-header title="The Browns" subtitle="Port Credit, Mississauga. Every weekend is planned around this." />
        <sd-page-header title="Ideas" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Screens without actions (Family, Ideas) leave the slots empty; the subtitle is optional too.',
      },
    },
  },
};
