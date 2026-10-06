import type { StoryObj } from '@storybook/angular';

import type { Media } from 'components';

export const Fallback: StoryObj<Media> = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 200px)); gap: 12px">
        <sd-media [photo]="null" tone="leaf" icon="tree" />
        <sd-media [photo]="null" tone="indoor" icon="popcorn" />
        <sd-media [photo]="null" tone="sun" icon="fork" />
        <sd-media [photo]="null" tone="sky" icon="ticket" />
      </div>
    `,
  }),
};
