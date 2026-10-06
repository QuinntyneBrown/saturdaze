import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Button } from 'components';

@Component({
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-button variant="primary">Plan my weekend</sd-button> `,
})
export default class ButtonScenario {}
