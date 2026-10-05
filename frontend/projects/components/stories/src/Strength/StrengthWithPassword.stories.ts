import { computed, signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Strength, StrengthLevel } from 'components';

function measure(password: string): { level: StrengthLevel | null; label: string } {
  if (!password) return { level: null, label: '' };
  if (password.length < 8) return { level: 'weak', label: 'Weak · eight characters or more.' };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 12 && classes >= 3) return { level: 'strong', label: 'Strong.' };
  return { level: 'ok', label: 'OK · eight characters or more. Add a capital letter to make it strong.' };
}

export const WithPassword: StoryObj<Strength> = {
  render: () => {
    const password = signal('');
    const strength = computed(() => measure(password()));
    return {
      props: { password, strength },
      template: `
        <div style="max-width: 360px; display: grid; gap: 8px">
          <sd-text-input
            label="Password"
            type="password"
            autocomplete="new-password"
            hint="Eight characters or more."
            [ngModel]="password()"
            (ngModelChange)="password.set($event)"
          />
          @if (strength().level) {
            <sd-strength [level]="strength().level" [label]="strength().label" />
          }
        </div>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Live, as on Create account: the page measures the password (eight characters is OK; twelve or more with three character classes is Strong) and shows the meter once something is typed. Try "pancakes", then "Pancakes4Brunch!".',
      },
    },
  },
};
