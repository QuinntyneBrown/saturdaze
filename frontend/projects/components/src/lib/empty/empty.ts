import {
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';

import { Icon } from '../icon/icon';

/**
 * Empty-state callout. Mirrors `docs/mocks/components/sd-empty.js`. Default
 * slot carries any follow-up CTAs.
 */

@Component({
  selector: 'sd-empty',
  standalone: true,
  imports: [Icon],
  templateUrl: './empty.html',
  styleUrl: './empty.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.title]': 'emptyTitle() || null',
    '[attr.subtitle]': 'subtitle() || null',
    '[attr.icon]': 'icon()',
  },
})
export class Empty {
  readonly emptyTitle = input<string>('Nothing here yet', { alias: 'title' });
  readonly subtitle = input<string>('');
  readonly icon = input<string>('sparkle');
}
