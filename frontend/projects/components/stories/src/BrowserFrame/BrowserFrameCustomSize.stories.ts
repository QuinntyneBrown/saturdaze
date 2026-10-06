import type { StoryObj } from '@storybook/angular';

import type { BrowserFrame } from 'components';

export const CustomSize: StoryObj<BrowserFrame> = {
  render: () => ({
    template: `
      <div style="max-width: 280px">
        <sd-browser-frame url="saturdaze.app/ideas" [frameWidth]="390" [frameHeight]="420">
          <div class="sd-stack sd-stack--sm">
            <sd-activity-card title="Terre Bleu Lavender Farm" meta="Milton" why="Lavender peaks 17 to 24 May." icon="tree" tone="leaf">
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />45 min</sd-chip>
            </sd-activity-card>
            <sd-activity-card title="The Rec Room" meta="Square One" why="Bowling, arcade and dinner under one roof." icon="popcorn" tone="indoor">
              <sd-chip slot="chips" tone="sky"><sd-icon name="car" [size]="13" [stroke]="2" />10 min</sd-chip>
            </sd-activity-card>
          </div>
        </sd-browser-frame>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Set `frameWidth` / `frameHeight` to a phone-sized design (390×420 here) to show a mobile composition in a narrow column.',
      },
    },
  },
};
