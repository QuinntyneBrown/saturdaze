import type { StoryObj } from '@storybook/angular';

import type { TextInput } from 'components';

export const Type: StoryObj<TextInput> = {
  render: () => ({
    template: `
      <div style="max-width: 420px; display: grid; gap: 16px">
        <sd-text-input label="Email" type="email" autocomplete="email" placeholder="you@example.com" />
        <sd-text-input label="Password" type="password" autocomplete="current-password" />
        <sd-text-input label="Age" type="number" [min]="0" [max]="120" placeholder="7" hint="Ages shape the picks." />
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">
          <sd-text-input label="Start" type="time" value="09:00" />
          <sd-text-input label="End" type="time" value="10:30" />
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '`type` is forwarded to the native input, along with `min`, `max` and `step` — email, password, number (a family member\'s age) and time (a weekly commitment).',
      },
    },
  },
};
