import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { GhostRow } from 'components';

export const UnderAList: StoryObj<GhostRow> = {
  render: () => {
    const errands = signal(['Groceries', 'Pick up dry cleaning']);
    const extra = ['Return library books', 'Hardware store', 'Birthday gift for Mae'];
    return {
      props: {
        errands,
        add: () => errands.update((all) => [...all, extra[(all.length - 2) % extra.length]!]),
      },
      template: `
        <div style="max-width: 420px">
          <ul style="display: grid; gap: 8px; list-style: none; padding: 0; margin: 0; font-size: 14px">
            @for (errand of errands(); track $index) {
              <li style="padding: 10px 12px; border-radius: 12px; background: var(--sd-surface-2)">{{ errand }}</li>
            }
          </ul>
          <sd-ghost-row icon="bag" (pressed)="add()">Add an errand</sd-ghost-row>
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'As a button it emits `pressed`. In the app that opens a CDK dialog; here it appends an errand so you can see the list grow.',
      },
    },
  },
};
