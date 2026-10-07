import { ChangeDetectionStrategy, Component } from '@angular/core';

import { List, PlaceRow, PlaceRowFlag } from 'components';

const FLAGS: readonly PlaceRowFlag[] = [
  { tone: 'sun', label: 'Unreviewed' },
  { tone: 'indoor', label: 'Missing alt text' },
];

@Component({
  imports: [PlaceRow],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-place-row
      title="Snug Harbour"
      subtitle="Restaurant · 1 photo"
      href="/places/Restaurant/1"
      tone="sun"
      icon="fork"
      [flags]="flags"
    />
  `,
})
export default class PlaceRowScenario {
  protected readonly flags = FLAGS;
}

@Component({
  imports: [List],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-list card><ng-content /></sd-list>`,
})
class ListDecorator {}

export { ListDecorator as decorator };
