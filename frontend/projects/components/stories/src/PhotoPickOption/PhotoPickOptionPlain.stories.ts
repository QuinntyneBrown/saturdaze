import type { StoryObj } from '@storybook/angular';

import type { PhotoPickOption } from 'components';

export const Plain: StoryObj<PhotoPickOption> = {
  render: () => ({
    template: `
      <sd-photo-pick style="max-width: 520px" label="Next primary">
        <sd-photo-pick-option name="next" value="none" label="No photo" plain checked>
          <sd-icon name="close" />
          No photo
        </sd-photo-pick-option>
      </sd-photo-pick>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`plain` draws the dashed tile and shows the projected icon and word instead of a photo.',
      },
    },
  },
};
