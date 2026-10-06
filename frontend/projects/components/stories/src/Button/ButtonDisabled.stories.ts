import type { StoryObj } from '@storybook/angular';

import type { Button } from 'components';

export const Disabled: StoryObj<Button> = {
  render: () => ({
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
        <sd-button disabled>Primary</sd-button>
        <sd-button variant="quiet" disabled>Quiet</sd-button>
        <sd-button href="/weekend" disabled>Link</sd-button>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'A disabled `<button>` gets the native `disabled`; a disabled link gets `aria-disabled="true"` and swallows the click.',
      },
    },
  },
};
