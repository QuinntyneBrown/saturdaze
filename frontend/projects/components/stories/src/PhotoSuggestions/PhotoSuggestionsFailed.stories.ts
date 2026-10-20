import type { StoryObj } from '@storybook/angular';

import type { PhotoSuggestions } from 'components';

export const Failed: StoryObj<PhotoSuggestions> = {
  render: () => ({
    template: `
      <sd-photo-suggestions style="max-width: 520px" label="Suggest photos" state="error" />
    `,
  }),
};
