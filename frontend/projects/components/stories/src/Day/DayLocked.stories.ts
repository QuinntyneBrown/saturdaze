import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Day } from 'components';

export const Locked: StoryObj<Day> = {
  render: () => {
    const locked = signal(true);
    const busy = signal(false);
    const regenerated = signal(0);
    return {
      props: {
        locked,
        busy,
        regenerated,
        setLocked: (next: boolean) => {
          busy.set(true);
          setTimeout(() => {
            locked.set(next);
            busy.set(false);
          }, 600);
        },
        regenerate: () => regenerated.update((n) => n + 1),
      },
      template: `
        <sd-day
          style="max-width: 560px"
          title="Sunday"
          meta="18 May · 18° / 12° · Cloudy by 2pm, indoor afternoon"
          weather="cloud"
          [locked]="locked()"
          [busy]="busy()"
          (lockToggle)="setLocked($event)"
          (regenerate)="regenerate()"
        >
          <sd-block time="8:30" duration="45m" icon="home" title="Pancakes at home" subtitle="Mae flips, Eli pours" />
          <sd-block commitment time="10:30" duration="75m" icon="home" title="Church" subtitle="Every Sunday · locked in">
            <sd-chip slot="chips" tone="accent"><sd-icon name="lock" [size]="13" [stroke]="2" />Commitment</sd-chip>
          </sd-block>
          <sd-block time="12:00" duration="75m" icon="fork" title="Lunch at Symposium Café" subtitle="Brunch · family booths" />
        </sd-day>
        <p class="sd-text-sm sd-text-soft sd-mt-4">Regenerate pressed {{ regenerated() }} time(s).</p>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          '`locked` adds `.day--locked` and the "Day locked" chip; the lock button mirrors it as `aria-pressed` and flips to Unlock day. `lockToggle` emits the next state — here the story fakes a request, holding `busy` (which disables both buttons) for a moment.',
      },
    },
  },
};
