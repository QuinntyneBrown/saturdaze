import type { StoryObj } from '@storybook/angular';

import type { Toolbar } from 'components';

const SORT = [
  { value: 'health', label: 'Worst health first' },
  { value: 'name', label: 'Name' },
  { value: 'changed', label: 'Recently changed' },
];

export const Default: StoryObj<Toolbar> = {
  render: () => ({
    props: { sort: SORT },
    template: `
      <sd-toolbar>
        <sd-text-input class="toolbar__search" label="Search" type="search" name="q" placeholder="Place name" />
        <sd-select class="toolbar__sort" label="Sort" name="sort" [options]="sort" />
      </sd-toolbar>
    `,
  }),
};
