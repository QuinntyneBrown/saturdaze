import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Icon, PhotoDrop } from 'components';

@Component({
  imports: [Icon, PhotoDrop],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-photo-drop label="Choose a photo">
      <sd-icon name="plus" />
      Choose a photo
    </sd-photo-drop>
  `,
})
export default class PhotoDropScenario {}
