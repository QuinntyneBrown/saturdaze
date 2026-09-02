import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';

import { ACTIVITY_SERVICE, EVENTS_SERVICE, EVENT_SUBMISSIONS_SERVICE, RESTAURANT_SERVICE } from 'api';
import { Button, Icon, PageHeader, Segments } from 'components';

import { DIALOG_OPTIONS } from '../../dialogs/confirm-dialog/confirm-dialog';
import { EventSubmittedDialog, EventSubmittedDialogData } from '../../dialogs/event-submitted-dialog/event-submitted-dialog';
import { SubmitEventDialog, SubmitEventDialogResult } from '../../dialogs/submit-event-dialog/submit-event-dialog';
import { IDEAS_SEGMENTS } from '../../shared/ideas-segments';

type IdeasTab = 'activities' | 'food' | 'events';

const FALLBACK_SUBTITLE: Record<IdeasTab, string> = {
  activities: 'Picked for your family, under 45 minutes from home.',
  food: 'Places to eat near what you are already doing.',
  events: 'What is on within 45 minutes of home.',
};

/**
 * Ideas — the header and the Activities · Food · Events segments; the
 * active segment renders in the outlet. "Suggest an event" belongs to the
 * Events tab and opens D10 → D11 from here.
 */
@Component({
  selector: 'app-ideas',
  standalone: true,
  imports: [RouterOutlet, Button, Icon, PageHeader, Segments],
  templateUrl: './ideas.page.html',
  styleUrl: './ideas.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdeasPage {
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);
  private readonly activities = inject(ACTIVITY_SERVICE);
  private readonly restaurants = inject(RESTAURANT_SERVICE);
  private readonly events = inject(EVENTS_SERVICE);
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);

  private readonly navigated = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)),
    { initialValue: null },
  );

  protected readonly segments = IDEAS_SEGMENTS;

  protected readonly tab = computed<IdeasTab>(() => {
    this.navigated();
    const url = this.router.url;
    if (url.startsWith('/ideas/food')) return 'food';
    if (url.startsWith('/ideas/events')) return 'events';
    return 'activities';
  });

  protected readonly subtitle = computed(() => {
    const tab = this.tab();
    const live =
      tab === 'activities'
        ? this.activities.list()().subtitle
        : tab === 'food'
          ? this.restaurants.list()().subtitle
          : this.events.list()().subtitle;
    return live || FALLBACK_SUBTITLE[tab];
  });

  protected async suggest(): Promise<void> {
    const ref = this.dialog.open<SubmitEventDialogResult>(SubmitEventDialog, DIALOG_OPTIONS);
    const submission = await firstValueFrom(ref.closed);
    if (!submission) return;
    this.dialog.open<void, EventSubmittedDialogData>(EventSubmittedDialog, {
      ...DIALOG_OPTIONS,
      data: { submission },
    });
    await this.submissions.loadMine();
  }
}
