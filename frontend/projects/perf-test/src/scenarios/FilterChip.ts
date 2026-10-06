import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FilterChip } from 'components';

@Component({
  imports: [FilterChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-filter-chip pressed>Outdoor</sd-filter-chip> `,
})
export default class FilterChipScenario {}
