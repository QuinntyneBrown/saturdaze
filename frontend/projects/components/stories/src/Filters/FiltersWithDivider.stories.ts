import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Filters } from 'components';

export const WithDivider: StoryObj<Filters> = {
  render: () => {
    const day = signal('Saturday');
    const kind = signal('All');
    return {
      props: { day, kind, days: ['Saturday', 'Sunday'], kinds: ['All', 'Outdoor', 'Indoor'] },
      template: `
        <sd-filters label="Day and kind" [scroll]="false">
          @for (d of days; track d) {
            <sd-filter-chip [pressed]="day() === d" (pressedChange)="day.set(d)">{{ d }}</sd-filter-chip>
          }
          <span class="sd-vdivider"></span>
          @for (k of kinds; track k) {
            <sd-filter-chip
              [tone]="k === 'Outdoor' ? 'leaf' : k === 'Indoor' ? 'indoor' : 'default'"
              [pressed]="kind() === k"
              (pressedChange)="kind.set(k)"
            >{{ k }}</sd-filter-chip>
          }
        </sd-filters>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Separate two chip groups with `<span class="sd-vdivider">`. Each group keeps its own single selection.',
      },
    },
  },
};
