import type { StoryObj } from '@storybook/angular';

import type { Avatar } from 'components';

export const Photo: StoryObj<Avatar> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-avatar name="Quinn" tone="primary" src="profile-photo.svg" size="sm" />
        <sd-avatar name="Quinn" tone="primary" src="profile-photo.svg" size="md" />
        <sd-avatar name="Quinn" tone="primary" src="profile-photo.svg" />
        <sd-avatar name="Quinn" tone="primary" src="profile-photo.svg" size="xl" />
        <sd-avatar name="Quinn" tone="primary" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "A `src` (the signed-in user's profile photo) replaces the initial and is cropped to the disc at every size. Without one, the initial shows.",
      },
    },
  },
};
