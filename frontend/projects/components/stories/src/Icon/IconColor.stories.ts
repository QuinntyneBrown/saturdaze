import type { StoryObj } from '@storybook/angular';

import type { Icon } from 'components';

export const Color: StoryObj<Icon> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center">
        <span style="color: var(--colorPaletteSunForeground1)"><sd-icon name="sun" [size]="24" /></span>
        <span style="color: var(--colorPaletteSkyForeground1)"><sd-icon name="rain" [size]="24" /></span>
        <span style="color: var(--colorPaletteLeafForeground1)"><sd-icon name="tree" [size]="24" /></span>
        <span style="color: var(--colorPaletteIndoorForeground1)"><sd-icon name="popcorn" [size]="24" /></span>
        <span style="color: var(--colorBrandForeground2)"><sd-icon name="fork" [size]="24" /></span>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Glyphs stroke with `currentColor`, so they take the text colour of whatever contains them — no colour input needed.',
      },
    },
  },
};
