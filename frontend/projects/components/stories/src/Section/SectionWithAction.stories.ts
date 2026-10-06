import type { StoryObj } from '@storybook/angular';

import type { Section } from 'components';

export const WithAction: StoryObj<Section> = {
  render: () => ({
    template: `
      <sd-section style="display: block; max-width: 480px" title="Likes and dislikes" subtitle="Liked tags get a boost. Disliked ones are left out.">
        <sd-button slot="action" variant="quiet" size="sm">
          <sd-icon name="edit" />
          Edit
        </sd-button>
        <div class="sd-cluster">
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Splash pads</sd-chip>
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Farmers' markets</sd-chip>
          <sd-chip tone="leaf"><sd-icon name="heart" [size]="13" [stroke]="2" />Bowling</sd-chip>
          <sd-chip tone="warn"><sd-icon name="close" [size]="13" [stroke]="2" />Long drives</sd-chip>
        </div>
      </sd-section>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Project a quiet small button into `[slot=action]` to put it at the right of the header (the "Edit" buttons on Family).',
      },
    },
  },
};
