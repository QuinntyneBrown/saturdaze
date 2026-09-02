import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  EVENT_SUBMISSIONS_SERVICE,
  EVENTS_SERVICE,
  EventSubmissionDto,
  dateTileParts,
  formatWhen,
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
  private readonly events = inject(EVENTS_SERVICE);
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);
  private readonly dialog = inject(Dialog);

  protected readonly view = this.events.list();
  protected readonly activeFilter = this.events.activeFilter();

  protected readonly myPending = computed<readonly PendingCardVm[]>(() => {
    return this.submissions
      .mine()()
      .filter((s) => s.status === 'Pending')
      .map(toPendingVm);
  });

  ngOnInit(): void {
    // Re-fetch on every visit: the window is date-relative and an event
    // submitted a moment ago may have been approved since.
    void this.events.load();
    void this.submissions.loadMine();
  }

  protected selectFilter(label: string): void {
    this.events.setFilter(label);
  }

  protected openQuickAdd(): void {
    this.dialog.open(SubmitEventDialog, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }
}

function toPendingVm(s: EventSubmissionDto): PendingCardVm {
  const tile = dateTileParts(s.startsAtLocal);
  return {
    id: s.id,
    title: s.title,
    venue: s.location ? `${s.location} · submitted by you` : 'submitted by you',
    when: formatWhen(s.startsAtLocal),
    dateDay: tile.day,
    dateMon: tile.mon,
  };
}
