import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TextInput } from 'components';

@Component({
  imports: [TextInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ` <sd-text-input label="Family name" placeholder="The Browns" /> `,
})
export default class TextInputScenario {}
