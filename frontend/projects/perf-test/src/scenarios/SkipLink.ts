import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SkipLink } from 'components';

@Component({
  imports: [SkipLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-skip-link /> `,
})
export default class SkipLinkScenario {}
