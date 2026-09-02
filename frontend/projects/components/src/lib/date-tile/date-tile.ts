import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Month-over-day tile for events and submissions. Mirrors `.date-tile`.
 * Takes an ISO date (`2026-05-17`) or an ISO date-time and renders "May / 17".
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

@Component({
  selector: 'sd-date-tile',
  standalone: true,
  templateUrl: './date-tile.html',
  styleUrl: './date-tile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'date-tile',
    'aria-hidden': 'true',
    '[attr.date]': 'date()',
  },
})
export class DateTile {
  readonly date = input<string>('');
  /** Pre-split parts ("May" / "17"); when given they win over `date`. */
  readonly mon = input<string>('');
  readonly day = input<string>('');

  protected readonly parts = computed(() => {
    if (this.mon() || this.day()) return { mon: this.mon(), day: this.day() };
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(this.date());
    if (!m) return { mon: '', day: '' };
    return { mon: MONTHS[Number(m[2]) - 1] ?? '', day: String(Number(m[3])) };
  });
}
