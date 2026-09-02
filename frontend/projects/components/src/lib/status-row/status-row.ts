import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Spinner } from '../spinner/spinner';

/**
 * "Working through your locks, the forecast and past weekends." — the
 * polite live region shown while the planner runs. Mirrors `.status-row`.
 */
@Component({
  selector: 'sd-status-row',
  standalone: true,
  imports: [Spinner],
  templateUrl: './status-row.html',
  styleUrl: './status-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'status-row',
    role: 'status',
    'aria-live': 'polite',
  },
})
export class StatusRow {
  readonly icon = input<string>('sparkle');
}
