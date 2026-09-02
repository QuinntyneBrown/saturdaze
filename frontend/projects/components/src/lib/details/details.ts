import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Label / value pairs (a submission's Location, Cost, Ages, Link, Notes).
 * Mirrors `.details` in docs/mocks-v2/styles/app.css. A null value renders
 * "Not given" in faint ink; `href` renders the value as an external link.
 */

export interface DetailItem {
  readonly label: string;
  readonly value: string | null;
  readonly href?: string | null;
}

@Component({
  selector: 'sd-details',
  standalone: true,
  imports: [Icon],
  templateUrl: './details.html',
  styleUrl: './details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'details',
  },
})
export class Details {
  readonly items = input<readonly DetailItem[]>([]);
  readonly missing = input<string>('Not given');
}
