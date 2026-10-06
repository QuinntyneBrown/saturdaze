import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Block } from 'components';

export const WithActions: StoryObj<Block> = {
  render: () => {
    const locked = signal(false);
    const last = signal('Hover the row (720px and up) or tap the chevron.');
    return {
      props: {
        locked,
        last,
        toggleLock: () => locked.update((v) => !v),
        say: (text: string) => last.set(text),
      },
      template: `
        <div role="list" style="max-width: 560px">
          <sd-block
            time="13:00"
            duration="75m"
            icon="fork"
            title="Lunch at La Marina"
            subtitle="Wife-approved · patio · 3 of 4 votes"
            [locked]="locked()"
            (details)="say('Details dialog for Lunch at La Marina')"
          >
            @if (locked()) {
              <sd-chip slot="chips" tone="accent"><sd-icon name="lock" [size]="13" [stroke]="2" />Locked</sd-chip>
            }
            <sd-button slot="actions" variant="ghost" size="sm" icon label="Why this: Lunch at La Marina" (click)="say('Why this: three of four votes, and a patio near Terre Bleu')">
              <sd-icon name="sparkle" />
            </sd-button>
            <sd-button slot="actions" variant="ghost" size="sm" icon label="Swap Lunch at La Marina" (click)="say('Swap for Symposium Café?')">
              <sd-icon name="swap" />
            </sd-button>
            <sd-button
              slot="actions"
              variant="ghost"
              size="sm"
              icon
              [label]="(locked() ? 'Unlock' : 'Lock') + ' Lunch at La Marina'"
              [pressed]="locked()"
              (click)="toggleLock()"
            >
              <sd-icon [name]="locked() ? 'unlock' : 'lock'" />
            </sd-button>
          </sd-block>
        </div>
        <p class="sd-text-sm sd-text-soft sd-mt-4">{{ last() }}</p>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Project ghost icon buttons into `[slot=actions]`: Why this, Swap and a Lock toggle bound to `pressed`. They reveal on hover from 720px; on phones the chevron emits `details` and the dialog carries the same actions.',
      },
    },
  },
};
