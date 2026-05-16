import { ChangeDetectionStrategy, Component } from '@angular/core';

import { SdBottomNav, SdTopBar } from 'components';

@Component({
  selector: 'app-components-gallery',
  standalone: true,
  imports: [SdTopBar, SdBottomNav],
  templateUrl: './components-gallery.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComponentsGalleryPage {}
