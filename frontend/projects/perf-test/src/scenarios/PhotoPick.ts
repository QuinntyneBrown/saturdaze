import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon, PhotoPick, PhotoPickOption } from 'components';

@Component({
  imports: [Icon, PhotoPick, PhotoPickOption],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-photo-pick label="Next primary">
      <sd-photo-pick-option
        name="next"
        value="a"
        label="Curated · Meadow"
        caption="Curated · Meadow"
        checked
      />
      <sd-photo-pick-option
        name="next"
        value="b"
        label="Curated · Shore"
        caption="Curated · Shore"
      />
      <sd-photo-pick-option name="next" value="none" label="No photo" plain>
        <sd-icon name="close" />
        No photo
      </sd-photo-pick-option>
    </sd-photo-pick>
  `,
})
export default class PhotoPickScenario {}
