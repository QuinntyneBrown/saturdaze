import type { StoryObj } from '@storybook/angular';

import type { PhotoSuggestions } from 'components';

export const Empty: StoryObj<PhotoSuggestions> = {
  render: () => ({
    template: `
      <sd-photo-suggestions style="max-width: 520px" label="Search" buttonLabel="Find photos"
        query="Port Credit Memorial Park" [minQuery]="3" state="done" />
    `,
  }),
};
