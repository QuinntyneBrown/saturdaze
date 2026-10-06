import { signal } from '@angular/core';
import type { StoryObj } from '@storybook/angular';

import type { Segments } from 'components';

export const Interactive: StoryObj<Segments> = {
  render: () => {
    const active = signal('Activities');
    return {
      props: {
        active,
        tabs: [
          { label: 'Activities', link: '/ideas', exact: true },
          { label: 'Food', link: '/ideas/food' },
          { label: 'Events', link: '/ideas/events' },
        ],
        pick: (event: MouseEvent) => {
          const tab = (event.target as HTMLElement).closest('a');
          if (tab?.textContent) active.set(tab.textContent.trim());
        },
      },
      template: `
        <sd-segments label="Idea type" [tabs]="tabs" [active]="active()" (click)="pick($event)" />
        <p class="sd-text-sm sd-text-soft sd-mt-4">Showing: {{ active() }}</p>
      `,
    };
  },
  parameters: {
    docs: {
      description: {
        story:
          'Each tab is a `routerLink`, so clicking navigates; here the story mirrors the clicked label into `active` to move `aria-current="page"`. On a real screen leave `active` unset and the router marks the current route.',
      },
    },
  },
};
