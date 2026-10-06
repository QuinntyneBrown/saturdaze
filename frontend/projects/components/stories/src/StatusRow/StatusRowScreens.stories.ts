import type { StoryObj } from '@storybook/angular';

import type { StatusRow } from 'components';

export const Screens: StoryObj<StatusRow> = {
  render: () => ({
    template: `
      <div style="max-width: 560px">
        <sd-status-row icon="sparkle">Looking for ideas near you.</sd-status-row>
        <sd-status-row icon="fork">Finding places to eat near your weekend.</sd-status-row>
        <sd-status-row icon="ticket">Checking what is on nearby.</sd-status-row>
        <sd-status-row icon="star">Gathering your weekends.</sd-status-row>
        <sd-status-row icon="user">Loading your family.</sd-status-row>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'The glyph and sentence used on each screen: Ideas, Food, Events, Past and Family.',
      },
    },
  },
};
