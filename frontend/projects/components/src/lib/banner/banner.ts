import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Inline message strip (form errors, read-only notices, save failures).
 * Mirrors `.banner` in docs/mocks-v2/styles/app.css. `role="alert"` for
 * errors, `status` (the default) for the rest.
 */

export type BannerTone = 'info' | 'warn' | 'success';

@Component({
  selector: 'sd-banner',
  standalone: true,
  imports: [Icon],
  templateUrl: './banner.html',
  styleUrl: './banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'banner',
    '[class.banner--info]': 'tone() === "info"',
    '[class.banner--warn]': 'tone() === "warn"',
    '[class.banner--success]': 'tone() === "success"',
    '[attr.tone]': 'tone()',
    '[attr.role]': 'role()',
    '[attr.aria-live]': 'role() === "alert" ? "assertive" : "polite"',
  },
})
export class Banner {
  readonly tone = input<BannerTone>('info');
  /** Leading glyph; empty = none. */
  readonly icon = input<string>('');
  readonly role = input<'alert' | 'status'>('status');
}
