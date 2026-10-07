import type { StoryObj } from '@storybook/angular';

import type { PhotoDrop } from 'components';

export const Default: StoryObj<PhotoDrop> = {
  args: { label: 'Choose a photo' },
  render: (args) => ({
    props: args,
    template: `
      <sd-photo-drop style="max-width: 480px" [label]="label">
        <sd-icon name="plus" />
        Choose a photo
      </sd-photo-drop>
    `,
  }),
};
