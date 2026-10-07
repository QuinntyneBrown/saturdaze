import type { StoryObj } from '@storybook/angular';

import type { SlotPreview } from 'components';

/** A place with no primary photo: every slot shows the fallback tile. */
export const Fallback: StoryObj<SlotPreview> = {
  args: {
    media: null,
    name: 'Riverwood Conservancy',
    meta: 'Mississauga',
    tone: 'leaf',
    icon: 'tree',
  },
  render: (args) => ({
    props: args,
    template: `<sd-slot-preview [media]="media" [name]="name" [meta]="meta" [tone]="tone" [icon]="icon" />`,
  }),
};
