import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Spinner } from 'components';

@Component({
  imports: [Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-spinner /> `,
})
export default class SpinnerScenario {}
