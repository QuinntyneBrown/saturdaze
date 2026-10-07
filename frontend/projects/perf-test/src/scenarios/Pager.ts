import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Pager } from 'components';

@Component({
  imports: [Pager],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-pager [page]="2" [pageSize]="50" [total]="120" /> `,
})
export default class PagerScenario {}
