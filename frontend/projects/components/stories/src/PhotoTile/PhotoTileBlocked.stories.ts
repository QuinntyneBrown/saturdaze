import type { StoryObj } from '@storybook/angular';

import type { PhotoTile } from 'components';

/** A photo whose URL is not HTTPS on an allowed origin: families never see it. */
export const Blocked: StoryObj<PhotoTile> = {
  args: {
    blocked: true,
    badges: [
      { tone: 'warn', icon: 'close', label: 'Blocked URL' },
      { tone: 'accent', label: 'Curated' },
    ],
    alt: 'Bowling lanes',
    credit: 'Photo · Jo Doe',
    licence: 'CC BY 4.0',
    size: '1200 × 675',
  },
  render: (args) => ({
    props: args,
    template: `
      <sd-photo-tile style="max-width: 340px" [blocked]="blocked" [badges]="badges"
        [alt]="alt" [credit]="credit" [licence]="licence" [size]="size" />
    `,
  }),
};
