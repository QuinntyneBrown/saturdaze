import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Stepper } from 'components';

@Component({
  imports: [Stepper],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<sd-stepper [step]="2" [count]="4" />`,
})
export default class StepperScenario {}
