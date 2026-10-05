import type { StoryObj } from '@storybook/angular';

import type { ListItem } from 'components';

export const AsLink: StoryObj<ListItem> = {
  render: () => ({
    template: `
      <sd-list card style="max-width: 420px">
        <sd-list-item href="/review-submissions" chevron title="Review submissions" subtitle="3 events waiting">
          <sd-disc slot="leading" icon="ticket" tone="sun" />
          <sd-chip slot="trailing" tone="sun" count>3</sd-chip>
        </sd-list-item>
        <sd-list-item href="/family" chevron title="Kids' ages" subtitle="Eli 9 · Mae 5">
          <sd-disc slot="leading" icon="user" />
        </sd-list-item>
      </sd-list>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'With `href` the row is an `<a>` that routes in-app paths through the Angular router — the Admin row on Family, or "Planned around" on an empty weekend.',
      },
    },
  },
};
