import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Toggle } from 'components';

export const WithoutLabel: StoryObj<Toggle> = {
  render: () => {
    const prefs = signal([
      { key: 'budget', title: 'Keep it cheap', subtitle: 'Free or under $40.', checked: false },
      {
        key: 'tryNew',
        title: 'Try something new',
        subtitle: 'One new place a weekend.',
        checked: true,
      },
      { key: 'fridayPreview', title: 'Friday preview', subtitle: 'A draft at 6pm.', checked: true },
    ]);
    return {
      props: {
        prefs,
        set: (key: string, checked: boolean) =>
          prefs.update((list) => list.map((p) => (p.key === key ? { ...p, checked } : p))),
      },
      template: `
        <div style="max-width: 440px">
          <sd-list card>
            @for (pref of prefs(); track pref.key) {
              <sd-list-item [title]="pref.title" [subtitle]="pref.subtitle">
                <sd-toggle slot="trailing" [srLabel]="pref.title" [ngModel]="pref.checked" (ngModelChange)="set(pref.key, $event)" />
              </sd-list-item>
            }
          </sd-list>
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'The Family preferences list: the row shows the title, so each switch has no visible `label` and takes `srLabel` as its accessible name.',
      },
    },
  },
};
