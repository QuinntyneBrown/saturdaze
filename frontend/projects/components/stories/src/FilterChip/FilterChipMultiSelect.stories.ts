import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { FilterChip } from 'components';

export const MultiSelect: StoryObj<FilterChip> = {
  render: () => {
    const extras = signal<Record<string, boolean>>({ 'Ages 5+': true, 'Under 30 min': false, 'Weather-safe': false });
    return {
      props: {
        extras,
        keys: ['Ages 5+', 'Under 30 min', 'Weather-safe'],
        set: (key: string, on: boolean) => extras.update((all) => ({ ...all, [key]: on })),
      },
      template: `
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          @for (key of keys; track key) {
            <sd-filter-chip tone="sky" [pressed]="extras()[key]" (pressedChange)="set(key, $event)">{{ key }}</sd-filter-chip>
          }
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: { story: 'For independent toggles, bind `[pressed]` and write the emitted `pressedChange` value straight back.' },
    },
  },
};
