import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Menu, MenuItem } from 'components';

export const Default: StoryObj<Menu> = {
  args: {
    label: 'Account',
    header: 'quinntynebrown@gmail.com',
    sheet: false,
    items: [
      { id: 'family', label: 'Family settings', icon: 'user', href: '/family' },
      { id: 'sign-out', label: 'Sign out', icon: 'sign_out', tone: 'warn' },
    ],
  },
  render: (args) => {
    const picked = signal('');
    return {
      props: { ...args, picked, onSelect: (item: MenuItem) => picked.set(item.label) },
      template: `
        <div style="display: grid; gap: 12px; justify-items: start">
          <sd-menu [label]="label" [header]="header" [sheet]="sheet" [items]="items" (select)="onSelect($event)" />
          <span class="sd-text-xs sd-text-soft">{{ picked() ? 'select emitted: ' + picked() : 'Pick an item.' }}</span>
        </div>
      `,
    };
  },
};
