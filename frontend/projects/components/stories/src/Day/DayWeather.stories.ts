import type { StoryObj } from '@storybook/angular';

import type { Day } from 'components';

export const Weather: StoryObj<Day> = {
  render: () => ({
    template: `
      <div style="display: grid; gap: 8px; max-width: 560px">
        <sd-day title="Saturday" meta="22° / 14° · Sunny, good for outdoors" weather="sun" [actions]="false" />
        <sd-day title="Sunday" meta="18° / 12° · Cloudy by 2pm" weather="cloud" [actions]="false" />
        <sd-day title="Saturday" meta="15° / 10° · Showers all morning" weather="rain" [actions]="false" />
        <sd-day title="Sunday" meta="-2° / -8° · Flurries, a good day for the rink" weather="snow" [actions]="false" />
        <sd-day title="Saturday" meta="Forecast lands on Wednesday" [actions]="false" />
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          '`weather` picks the disc: `sun` (sun tone), `cloud`, `rain` and `snow` (sky tone). Leave it `null` and no disc renders.',
      },
    },
  },
};
