import type { StoryObj } from '@storybook/angular';

import type { BrowserFrame } from 'components';

import { MINI_WEEKEND_STYLES, MINI_WEEKEND_TEMPLATE } from './sample';

export const Default: StoryObj<BrowserFrame> = {
  args: {
    url: 'saturdaze.app/weekend',
    frameWidth: 720,
    frameHeight: 300,
  },
  render: (args) => ({
    props: args,
    styles: MINI_WEEKEND_STYLES,
    template: `
      <div style="max-width: 560px">
        <sd-browser-frame [url]="url" [frameWidth]="frameWidth" [frameHeight]="frameHeight">
          ${MINI_WEEKEND_TEMPLATE}
        </sd-browser-frame>
      </div>
    `,
  }),
};
