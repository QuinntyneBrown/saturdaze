import type { StoryObj } from '@storybook/angular';

import { specimen } from './dialogs';

export const ShareLink: StoryObj = {
  name: 'Share link',
  render: () => ({
    template: specimen(`
      <sd-dialog static title="Share this weekend" subtitle="Anyone with the link can view it. Nobody can edit.">
        <sd-copy-field value="saturdaze.app/s/may17-browns" />
        <p class="sd-text-xs sd-text-soft">Read-only · expires in 7 days</p>
        <sd-button slot="actions" variant="primary">Done</sd-button>
      </sd-dialog>
    `),
  }),
  globals: { viewport: { value: 'desktop' } },
  parameters: {
    docs: {
      description: {
        story:
          'The Share action on Weekend. `sd-copy-field` writes the link to the clipboard and flips to "Copied" (`aria-pressed`, live region) for a moment. One Done button — there is nothing to cancel.',
      },
    },
  },
};
