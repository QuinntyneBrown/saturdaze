import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EVENT_SUBMISSIONS_SERVICE } from 'api';
import { BottomNav, Button, Card, Chip, Icon, TopBar } from 'components';

const MONTH_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

@Component({
  selector: 'app-events-submitted',
  standalone: true,
  imports: [BottomNav, Button, Card, Chip, Icon, RouterLink, TopBar],
  templateUrl: './events-submitted.page.html',
  styleUrl: './events-submitted.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsSubmittedPage {
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);

  protected readonly latest = computed(() => {
    const rows = this.submissions.mine()();
    if (rows.length === 0) return null;
    const sorted = [...rows].sort(
      (a, b) => Date.parse(b.submittedAtUtc) - Date.parse(a.submittedAtUtc),
    );
    return sorted[0]!;
  });

  protected readonly dateParts = computed(() => {
    const latest = this.latest();
    if (!latest) return null;
    const d = new Date(latest.startsAtLocal);
    return { day: String(d.getDate()), mon: MONTH_ABBR[d.getMonth()]! };
  });

  protected readonly whenLabel = computed(() => {
    const latest = this.latest();
    if (!latest) return '';
    const d = new Date(latest.startsAtLocal);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: d.getMinutes() === 0 ? undefined : '2-digit',
    });
  });
}
