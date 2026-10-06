import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { ListItem } from 'components';

export const Action: StoryObj<ListItem> = {
  render: () => {
    const opened = signal<string | null>(null);
    return {
      props: { opened, open: (name: string) => opened.set(name) },
      template: `
        <div style="max-width: 420px">
          <sd-list card>
            <sd-list-item action chevron title="Eli" subtitle="Kid · 9" (pressed)="open('Eli')">
              <sd-avatar slot="leading" name="Eli" tone="sky" size="lg" />
            </sd-list-item>
            <sd-list-item action chevron title="Mae" subtitle="Kid · 5" (pressed)="open('Mae')">
              <sd-avatar slot="leading" name="Mae" tone="sun" size="lg" />
            </sd-list-item>
          </sd-list>
          <p class="sd-text-sm sd-text-soft sd-mt-4">{{ opened() ? 'Would open the member dialog for ' + opened() : 'Tap a person to edit.' }}</p>
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          '`action` renders the row as a `<button>`; `pressed` emits on click — on Family it opens the member dialog.',
      },
    },
  },
};
