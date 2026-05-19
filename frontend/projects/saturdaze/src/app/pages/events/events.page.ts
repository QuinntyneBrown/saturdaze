import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  EVENT_SUBMISSIONS_SERVICE,
  EVENTS_SERVICE,
  EventSubmissionDto,
} from 'api';
import {
  BottomNav,
  Chip,
  EventCard,
  Icon,
  Section,
  TagGroup,
  TopBar,
} from 'components';

import { SubmitEventDialog } from '../../dialogs/submit-event-dialog/submit-event-dialog';

const MONTH_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

interface PendingCardVm {
  readonly id: string;
  readonly title: string;
  readonly venue: string;
  readonly when: string;
  readonly dateDay: string;
  readonly dateMon: string;
}

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [
    BottomNav,
    Chip,
    EventCard,
    Icon,
    RouterLink,
    Section,
    TagGroup,
    TopBar,
  ],
  templateUrl: './events.page.html',
  styleUrl: './events.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventsPage implements OnInit {
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);
  private readonly dialog = inject(Dialog);

  protected readonly view = inject(EVENTS_SERVICE).list();

  protected readonly myPending = computed<readonly PendingCardVm[]>(() => {
    return this.submissions
      .mine()()
      .filter((s) => s.status === 'Pending')
      .map(toPendingVm);
  });

  ngOnInit(): void {
    void this.submissions.loadMine();
  }

  protected openQuickAdd(): void {
    this.dialog.open(SubmitEventDialog, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}

function toPendingVm(s: EventSubmissionDto): PendingCardVm {
  const d = new Date(s.startsAtLocal);
  return {
    id: s.id,
    title: s.title,
    venue: s.location ? `${s.location} · submitted by you` : 'submitted by you',
    when: d.toLocaleString(undefined, {
      weekday: 'short',
      hour: 'numeric',
      minute: d.getMinutes() === 0 ? undefined : '2-digit',
    }),
    dateDay: String(d.getDate()),
    dateMon: MONTH_ABBR[d.getMonth()]!,
  };
}
