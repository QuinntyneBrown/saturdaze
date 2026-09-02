import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EVENT_SUBMISSIONS_SERVICE, dateTileParts, formatWhen } from 'api';
import { BottomNav, Button, Card, Chip, Icon, TopBar } from 'components';

@Component({
  selector: 'app-events-submitted',
  standalone: true,
  imports: [BottomNav, Button, Card, Chip, Icon, RouterLink, TopBar],
  templateUrl: './events-submitted.page.html',
  styleUrl: './events-submitted.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsSubmittedPage implements OnInit {
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
    return latest ? dateTileParts(latest.startsAtLocal) : null;
  });

  protected readonly whenLabel = computed(() => {
    const latest = this.latest();
    return latest ? formatWhen(latest.startsAtLocal) : '';
  });

  ngOnInit(): void {
    // A direct visit (or a refresh) arrives with an empty cache; fetch so
    // the confirmation shows the real submission instead of fallback copy.
    if (this.submissions.mine()().length === 0) {
      void this.submissions.loadMine();
    }
  }
}
