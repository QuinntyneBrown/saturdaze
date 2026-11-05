import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CoupleDateView, DATE_SERVICE, DateRefusal, DateStepView, WEEKEND_PLAN_SERVICE } from 'api';
import { Banner, Block, Button, GhostRow, Icon, PageHeader, Section, StatusRow } from 'components';

import { DIALOG_OPTIONS, confirmWith } from '../../dialogs/confirm-dialog/confirm-dialog';
import {
  DateActivityDialog,
  DateActivityDialogData,
  DateActivityDialogResult,
} from '../../dialogs/date-activity-dialog/date-activity-dialog';
import {
  MoveDateDialog,
  MoveDateDialogData,
} from '../../dialogs/move-date-dialog/move-date-dialog';

type Status = 'loading' | 'ready' | 'missing';

/**
 * A couple's date — `docs/mocks/pages/weekend.date.html` (L2-225): the plan with
 * why each pick was made, kids-need-care, and Move (D41), Regenerate (D42),
 * Cancel (D43), Swap restaurant (D39) and Change activity (D40). Every change
 * opens a dialog; a refusal (409) shows the server's reason in a warn banner.
 */
@Component({
  selector: 'app-date',
  standalone: true,
  imports: [Banner, Block, Button, GhostRow, Icon, PageHeader, Section, StatusRow],
  templateUrl: './date.page.html',
  styleUrl: './date.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePage {
  private readonly dates = inject(DATE_SERVICE);
  private readonly weekendService = inject(WEEKEND_PLAN_SERVICE);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly dateId = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';

  protected readonly status = signal<Status>('loading');
  protected readonly date = signal<CoupleDateView | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  private weekendId = '';

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      await this.weekendService.loadCurrent();
      this.weekendId = this.weekendService.getWeekend()().id ?? '';
      const date = this.weekendId ? await this.dates.get(this.weekendId, this.dateId) : null;
      this.date.set(date);
      this.status.set(date ? 'ready' : 'missing');
    } catch (err) {
      console.error('DatePage load failed', err);
      this.status.set('missing');
    }
  }

  protected stepAction(step: DateStepView): Promise<void> {
    if (step.kind === 'Meal') return this.swapRestaurant();
    if (step.kind === 'Activity') return this.changeActivity();
    return Promise.resolve();
  }

  protected async swapRestaurant(): Promise<void> {
    const date = this.date();
    if (!date) return;
    const ok = await confirmWith(this.dialog, {
      title: `Swap ${date.restaurantName}?`,
      body: `Saturdaze picks the next best ${date.meal.toLowerCase()} spot that fits the same time.`,
      well: {
        icon: 'fork',
        tone: 'primary',
        title: `Still ${date.meal.toLowerCase()}, still ${date.day}`,
        body: 'The activity stays if it still fits. A place you swapped away is not offered again for this date.',
      },
      confirmLabel: 'Swap restaurant',
      icon: 'swap',
    });
    if (ok) await this.change(() => this.dates.swapRestaurant(this.weekendId, date.id));
  }

  protected async changeActivity(): Promise<void> {
    const date = this.date();
    if (!date?.activityName) return;
    const step = date.steps.find((s) => s.kind === 'Activity');
    const ref = this.dialog.open<DateActivityDialogResult, DateActivityDialogData>(
      DateActivityDialog,
      {
        ...DIALOG_OPTIONS,
        data: {
          activity: date.activityName,
          detail: step?.reason ?? '',
          meal: date.meal.toLowerCase(),
        },
      },
    );
    const choice = await firstValueFrom(ref.closed);
    if (choice === 'drop')
      await this.change(() => this.dates.dropActivity(this.weekendId, date.id));
    if (choice === 'swap')
      await this.change(() => this.dates.swapActivity(this.weekendId, date.id));
  }

  protected addActivity(): Promise<void> {
    const date = this.date();
    if (!date) return Promise.resolve();
    return this.change(() => this.dates.swapActivity(this.weekendId, date.id));
  }

  protected async move(): Promise<void> {
    const date = this.date();
    if (!date) return;
    const ref = this.dialog.open<MoveDateDialogData, MoveDateDialogData>(MoveDateDialog, {
      ...DIALOG_OPTIONS,
      data: { day: date.day, meal: date.meal },
    });
    const to = await firstValueFrom(ref.closed);
    if (to) await this.change(() => this.dates.move(this.weekendId, date.id, to.day, to.meal));
  }

  protected async regenerate(): Promise<void> {
    const date = this.date();
    if (!date) return;
    const ok = await confirmWith(this.dialog, {
      title: 'Regenerate the date?',
      body: 'Same meal, same day, same two people. The restaurant and activity are chosen again.',
      well: {
        icon: 'heart',
        tone: 'accent',
        title: 'Keeping',
        body: `${date.day} ${date.meal.toLowerCase()}`,
      },
      confirmLabel: 'Regenerate date',
      icon: 'refresh',
    });
    if (ok) await this.change(() => this.dates.regenerate(this.weekendId, date.id));
  }

  protected async cancel(): Promise<void> {
    const date = this.date();
    if (!date) return;
    const ok = await confirmWith(this.dialog, {
      title: 'Cancel the date?',
      body: `The family plan for ${date.day} is planned again without it. Nothing was booked, so there is nothing else to cancel.`,
      confirmLabel: 'Cancel date',
      cancelLabel: 'Keep the date',
      danger: true,
      icon: 'trash',
    });
    if (!ok) return;
    await this.change(async () => {
      await this.dates.cancel(this.weekendId, date.id);
      await this.router.navigate(['/weekend']);
      return null;
    });
  }

  private async change(work: () => Promise<CoupleDateView | null>): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      const next = await work();
      if (next) this.date.set(next);
    } catch (err) {
      if (err instanceof DateRefusal) this.error.set(err.message);
      else {
        console.error('DatePage change failed', err);
        this.error.set('Something did not go through. Try again in a moment.');
      }
    } finally {
      this.busy.set(false);
    }
  }
}
