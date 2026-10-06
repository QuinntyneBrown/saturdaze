import type { StoryObj } from '@storybook/angular';

import type { PageHeader } from 'components';

export const BackLink: StoryObj<PageHeader> = {
  render: () => ({
    template: `
      <sd-page-header
        title="Review submissions"
        subtitle="Three waiting, oldest first. Approving publishes to every family nearby."
        backHref="/family"
        backLabel="Family"
      />
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`backHref` adds an eyebrow link ("Family") above the title from 720px and a ghost back icon button labelled "Back to Family" beside it on phones. In-app paths route through the Angular router.',
      },
    },
  },
};
