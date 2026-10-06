import type { StoryObj } from '@storybook/angular';

import type { Scrolled } from 'components';

export const Default: StoryObj<Scrolled> = {
  render: () => ({
    props: { rows: Array.from({ length: 30 }, (_, i) => i + 1) },
    styles: [
      `.demo-bar { position: sticky; top: 0; z-index: 1; padding: 16px var(--layoutGutter); font-weight: var(--fontWeightSemibold); transition: background var(--durationNormal) var(--curveEasyEase), box-shadow var(--durationNormal) var(--curveEasyEase); }`,
      `.demo-bar[data-scrolled] { background: color-mix(in srgb, var(--colorNeutralBackground2) 86%, transparent); backdrop-filter: blur(10px); box-shadow: 0 1px 0 var(--colorNeutralStroke2); }`,
      `.demo-bar__state::after { content: 'at the top'; color: var(--colorNeutralForeground2); font-weight: var(--fontWeightRegular); }`,
      `.demo-bar[data-scrolled] .demo-bar__state::after { content: 'data-scrolled'; color: var(--colorBrandForeground2); }`,
    ],
    template: `
      <header class="demo-bar" sdScrolled>Sticky header · <span class="demo-bar__state"></span></header>
      <div class="sd-stack" style="padding: 16px var(--layoutGutter)">
        @for (row of rows; track row) {
          <p class="sd-text-soft">Row {{ row }} — scroll the frame.</p>
        }
      </div>
    `,
  }),
};
