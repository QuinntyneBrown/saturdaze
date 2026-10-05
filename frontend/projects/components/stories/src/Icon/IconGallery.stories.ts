import type { StoryObj } from '@storybook/angular';

import { ICON_NAMES, type Icon } from 'components';

export const Gallery: StoryObj<Icon> = {
  render: () => ({
    props: { names: ICON_NAMES },
    template: `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); gap: 12px">
        @for (name of names; track name) {
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 8px; border-radius: 12px; background: var(--sd-surface-2)">
            <sd-icon [name]="name" [size]="24" />
            <code style="font-size: 12px">{{ name }}</code>
          </div>
        }
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Every glyph in `ICON_NAMES`, the exported list of names the sprite knows. Use it to pick a glyph — anything else falls back to `sparkle`.',
      },
    },
  },
};
