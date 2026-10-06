import type { StoryObj } from '@storybook/angular';

import type { ListItem } from 'components';

export const SubtitleFirst: StoryObj<ListItem> = {
  render: () => ({
    template: `
      <sd-list card style="max-width: 420px">
        <sd-list-item subtitleFirst subtitle="Email" title="sara.brown@example.com">
          <sd-disc slot="leading" icon="mail" />
        </sd-list-item>
        <sd-list-item subtitleFirst subtitle="Home" title="Port Credit, Mississauga">
          <sd-disc slot="leading" icon="pin" />
        </sd-list-item>
      </sd-list>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '`subtitleFirst` puts the small label above the value — account and settings rows.',
      },
    },
  },
};
