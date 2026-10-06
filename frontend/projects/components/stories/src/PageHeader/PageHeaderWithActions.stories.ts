import type { StoryObj } from '@storybook/angular';

import type { PageHeader } from 'components';

export const WithActions: StoryObj<PageHeader> = {
  render: () => ({
    template: `
      <sd-page-header title="This weekend" subtitle="Sunny Saturday for the lavender, a cloudy Sunday for the Rec Room.">
        <sd-button slot="more" variant="quiet" icon label="More options"><sd-icon name="more" /></sd-button>
        <sd-button slot="actions" variant="quiet"><sd-icon name="calendar" />Add to calendar</sd-button>
        <sd-button slot="primary" variant="primary"><sd-icon name="share" />Share</sd-button>
      </sd-page-header>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The Weekend header: Share in `[slot=primary]`, Add to calendar in `[slot=actions]` and the overflow in `[slot=more]`. Switch to the Mobile viewport to see the primary span the row and More move beside the title.',
      },
    },
  },
};
