import type { StoryObj } from '@storybook/angular';

import type { Toolbar } from 'components';

export const Fields: StoryObj<Toolbar> = {
  render: () => ({
    props: {
      places: [
        { value: 'all', label: 'All places' },
        { value: 'bronte', label: 'Bronte Creek Provincial Park' },
      ],
      admins: [
        { value: 'all', label: 'Everyone' },
        { value: 'jo', label: 'jo.curator@saturdaze.app' },
      ],
    },
    template: `
      <sd-toolbar layout="fields">
        <sd-select label="Place" name="place" [options]="places" />
        <sd-select label="Administrator" name="admin" [options]="admins" />
      </sd-toolbar>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`layout="fields"` gives every field the same width, up to 320px: the Activity log\'s place and administrator filters.',
      },
    },
  },
};
