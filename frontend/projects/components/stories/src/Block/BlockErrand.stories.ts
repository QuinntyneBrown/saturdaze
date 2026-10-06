import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Block } from 'components';

export const Errand: StoryObj<Block> = {
  render: () => {
    const done = signal(false);
    return {
      props: { done, toggle: () => done.update((v) => !v) },
      template: `
        <div role="list" style="max-width: 560px">
          <sd-block errand [done]="done()" time="9:30" duration="45m" icon="bag" title="Costco run" subtitle="Paper towels, bread, yogurt">
            <sd-chip slot="chips" tone="indoor">Errand</sd-chip>
            <sd-button
              slot="actions"
              variant="ghost"
              size="sm"
              icon
              [label]="'Mark Costco run' + (done() ? ' not done' : ' done')"
              [pressed]="done()"
              (click)="toggle()"
            >
              <sd-icon name="check" />
            </sd-button>
          </sd-block>
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          '`errand` rows get a Done toggle; `done` (`.block--done`) fades the row to 60% once it is ticked off.',
      },
    },
  },
};
