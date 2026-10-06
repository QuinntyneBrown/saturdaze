import type { StoryObj } from '@storybook/angular';

import type { BrowserFrame } from 'components';

import { MINI_WEEKEND_STYLES, MINI_WEEKEND_TEMPLATE } from './sample';

export const Scaling: StoryObj<BrowserFrame> = {
  render: () => ({
    props: { widths: [720, 480, 300] },
    styles: MINI_WEEKEND_STYLES,
    template: `
      <div class="sd-stack sd-stack--lg">
        @for (w of widths; track w) {
          <div [style.max-width.px]="w">
            <p class="sd-text-xs sd-text-soft sd-mb-2">Container {{ w }}px</p>
            <sd-browser-frame>${MINI_WEEKEND_TEMPLATE}</sd-browser-frame>
          </div>
        }
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The same 720×300 composition in three containers. The view keeps its proportions; at 720px and wider the scale is 1 (it never scales up).',
      },
    },
  },
};
