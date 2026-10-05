import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { FilterChip } from 'components';

export const SingleSelect: StoryObj<FilterChip> = {
  render: () => {
    const day = signal('This weekend');
    return {
      props: { day, days: ['This weekend', 'Saturday', 'Sunday', 'Next weekend'] },
      template: `
        <div style="display: grid; gap: 12px">
          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            @for (d of days; track d) {
              <sd-filter-chip [pressed]="day() === d" (pressedChange)="day.set(d)">{{ d }}</sd-filter-chip>
            }
          </div>
          <p style="font-size: 14px">Showing events for <strong>{{ day() }}</strong>.</p>
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'The page owns the truth. For a single-select row, ignore the emitted value and set the clicked chip as the one selection — pressing the active chip keeps it on.',
      },
    },
  },
};
