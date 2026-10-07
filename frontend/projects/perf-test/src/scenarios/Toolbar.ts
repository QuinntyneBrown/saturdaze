import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Select, SelectOption, TextInput, Toolbar } from 'components';

const SORT: readonly SelectOption[] = [
  { value: 'health', label: 'Worst health first' },
  { value: 'name', label: 'Name' },
];

@Component({
  imports: [Select, TextInput, Toolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-toolbar>
      <sd-text-input label="Search" type="search" name="q" placeholder="Place name" />
      <sd-select label="Sort" name="sort" [options]="sort" />
    </sd-toolbar>
  `,
})
export default class ToolbarScenario {
  protected readonly sort = SORT;
}
