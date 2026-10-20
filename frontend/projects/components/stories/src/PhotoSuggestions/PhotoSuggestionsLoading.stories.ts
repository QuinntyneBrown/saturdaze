import type { StoryObj } from '@storybook/angular';

import type { PhotoSuggestions } from 'components';

export const Loading: StoryObj<PhotoSuggestions> = {
  render: () => ({
    template: `
      <sd-photo-suggestions style="max-width: 520px" label="Find a photo" buttonLabel="Find photos"
        query="sunflower field" [minQuery]="3" state="loading" />
    `,
  }),
};
