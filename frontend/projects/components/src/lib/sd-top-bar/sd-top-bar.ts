import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  input,
} from '@angular/core';
import { Location } from '@angular/common';

import { SdIcon } from '../sd-icon/sd-icon';

/**
 * Page header. Mirrors `docs/mocks/components/sd-top-bar.js`.
 *
 * - `title` attribute is mirrored so e2e + visual diff anchors keep working.
 * - `back` (presence attribute) renders the circular back affordance.
 * - Leading / trailing slots are projected so pages can add calendar /
 *   share buttons (Home) or other controls.
 *
 * The back link uses `[Location]` so the browser history rewinds rather
 * than navigating to a static href the mock relied on.
 */

@Component({
  selector: 'sd-top-bar',
  standalone: true,
  imports: [SdIcon],
  templateUrl: './sd-top-bar.html',
  styleUrl: './sd-top-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'titleAttr() || null',
    '[attr.back]': 'back() ? "" : null',
  },
})
export class SdTopBar {
  // Avoid clashing with the DOM `title` attribute name on the host. The
  // signal-input is named `titleAttr` internally but bound from templates as
  // `title="..."` — Angular's selector-binding resolves on the public alias.
  readonly titleAttr = input<string>('', { alias: 'title' });
  readonly back = input(false, { transform: (v: '' | boolean) => v === '' || v === true });

  private readonly location = inject(Location);

  protected onBack(event: MouseEvent): void {
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.location.back();
  }
}
