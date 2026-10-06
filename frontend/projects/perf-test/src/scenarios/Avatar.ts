import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Avatar } from 'components';

@Component({
  imports: [Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-avatar name="Maya" tone="leaf" /> `,
})
export default class AvatarScenario {}
