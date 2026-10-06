import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Checkbox } from 'components';

@Component({
  imports: [Checkbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-checkbox name="fridayPreview">Send me the Friday preview.</sd-checkbox> `,
})
export default class CheckboxScenario {}
