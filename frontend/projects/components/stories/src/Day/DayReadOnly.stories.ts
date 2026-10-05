import type { StoryObj } from '@storybook/angular';

import type { Day } from 'components';

export const ReadOnly: StoryObj<Day> = {
  render: () => ({
    template: `
      <sd-day style="max-width: 560px" title="Saturday" meta="17 May · 22° / 14°" weather="sun" [actions]="false">
        <sd-block readonly time="9:00" duration="60m" icon="bike" title="Swim lessons" subtitle="Every Saturday" />
        <sd-block readonly time="11:00" duration="2h" icon="tree" title="Lavender fields" subtitle="Terre Bleu, Milton">
          <sd-chip slot="chips" tone="primary">Day highlight</sd-chip>
        </sd-block>
        <sd-block readonly time="13:00" duration="75m" icon="fork" title="Lunch at La Marina" subtitle="Patio" />
      </sd-day>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'The shared weekend and the landing preview: `actions` off on the day and `readonly` on each block, so nothing can be changed.',
      },
    },
  },
};
