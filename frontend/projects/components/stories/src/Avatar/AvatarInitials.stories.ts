import type { StoryObj } from '@storybook/angular';

import type { Avatar } from 'components';

export const Initials: StoryObj<Avatar> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 12px; max-width: 360px; font-size: 14px">
        <div style="display: flex; gap: 10px; align-items: center"><sd-avatar name="eli" tone="sky" /> eli — lower-case name</div>
        <div style="display: flex; gap: 10px; align-items: center"><sd-avatar name="mae.parker@example.com" tone="sun" size="sm" /> mae.parker&#64;example.com</div>
        <div style="display: flex; gap: 10px; align-items: center"><sd-avatar name="   " /> Blank name falls back to ?</div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          'The initial is the first non-space character, upper-cased. An email works as a name; a blank name renders `?`.',
      },
    },
  },
};
