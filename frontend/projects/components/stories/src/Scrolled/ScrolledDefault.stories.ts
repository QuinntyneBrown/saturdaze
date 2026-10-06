import type { StoryObj } from '@storybook/angular';

import type { Scrolled } from 'components';

export const Default: StoryObj<Scrolled> = {
  render: () => ({
    props: { rows: Array.from({ length: 30 }, (_, i) => i + 1) },
    styles: [
      `.demo-bar { position: sticky; top: 0; z-index: 1; padding: 16px var(--sd-gutter); font-weight: var(--sd-fw-semibold); transition: background var(--sd-dur-base) var(--sd-ease), box-shadow var(--sd-dur-base) var(--sd-ease); }`,
      `.demo-bar[data-scrolled] { background: color-mix(in srgb, var(--sd-bg) 86%, transparent); backdrop-filter: blur(10px); box-shadow: 0 1px 0 var(--sd-line); }`,
      `.demo-bar__state::after { content: 'at the top'; color: var(--sd-ink-soft); font-weight: var(--sd-fw-regular); }`,
      `.demo-bar[data-scrolled] .demo-bar__state::after { content: 'data-scrolled'; color: var(--sd-primary-deep); }`,
    ],
    template: `
      <header class="demo-bar" sdScrolled>Sticky header · <span class="demo-bar__state"></span></header>
      <div class="sd-stack" style="padding: 16px var(--sd-gutter)">
        @for (row of rows; track row) {
          <p class="sd-text-soft">Row {{ row }} — scroll the frame.</p>
        }
      </div>
    `,
  }),
};
