import type { StoryObj } from '@storybook/angular';

import type { FilterChip } from 'components';

export const Default: StoryObj<FilterChip> = {
  args: {
    pressed: false,
    tone: 'leaf',
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `<sd-filter-chip [pressed]="pressed" [tone]="tone" [disabled]="disabled" (pressedChange)="pressed = $event">Outdoor</sd-filter-chip>`,
  }),
};
