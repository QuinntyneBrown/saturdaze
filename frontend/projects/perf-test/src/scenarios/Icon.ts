import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon } from 'components';

@Component({
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-icon name="tree" /> `,
})
export default class IconScenario {}
