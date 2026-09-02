import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Rotating ring. Mirrors `.spinner` / `.spinner-disc` in
 * docs/mocks-v2/styles/app.css. With `icon` a glyph sits inside the ring
 * (the generating status row, the verifying auth card).
 */
@Component({
  selector: 'sd-spinner',
  standalone: true,
  imports: [Icon],
  templateUrl: './spinner.html',
  styleUrl: './spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class.spinner-disc]': '!!icon()',
    '[class.spinner--sm]': 'size() === "sm"',
    '[attr.size]': 'size() === "md" ? null : size()',
    '[attr.icon]': 'icon() || null',
  },
})
export class Spinner {
  readonly size = input<'sm' | 'md'>('md');
  readonly icon = input<string>('');
}
