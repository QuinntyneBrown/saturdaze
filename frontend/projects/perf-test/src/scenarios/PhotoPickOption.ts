import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PhotoPickOption } from 'components';

@Component({
  imports: [PhotoPickOption],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-photo-pick-option
      name="cover"
      value="harbour"
      label="Port Credit Harbour"
      caption="Port Credit Harbour"
    />
  `,
})
export default class PhotoPickOptionScenario {}
