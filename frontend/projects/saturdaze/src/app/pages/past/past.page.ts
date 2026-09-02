import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PastWeekendCard, SAVED_SERVICE, WEEKEND_PLAN_SERVICE } from 'api';
import { Banner, Button, Chip, Empty, FilterChip, Filters, Icon, PageHeader, PastCard, StatusRow } from 'components';

import { DIALOG_OPTIONS, confirmWith } from '../../dialogs/confirm-dialog/confirm-dialog';
import { RatingDialog, RatingDialogData, RatingDialogResult } from '../../dialogs/rating-dialog/rating-dialog';
import {
  RenameWeekendDialog,
  RenameWeekendDialogData,
  RenameWeekendDialogResult,
} from '../../dialogs/rename-weekend-dialog/rename-weekend-dialog';
import { chipTone, filterTone } from '../../shared/chip-tones';
import { devState } from '../../shared/dev-state';

/**
 * Past weekends — `docs/mocks-v2/pages/past.html`: filters, the "Skipping
 * next time" strip, and a grid of `sd-past-card`s (favourite, rename, rate,
 * Remix, Repeat). Empty state from `past.empty.html`.
 */
@Component({
  selector: 'app-past',
  standalone: true,
  imports: [Banner, Button, Chip, Empty, FilterChip, Filters, Icon, PageHeader, PastCard, StatusRow],
  templateUrl: './past.page.html',
  styleUrl: './past.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PastPage {
  private readonly saved = inject(SAVED_SERVICE);
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly dev = devState(this.route);

  protected readonly view = this.saved.list();
  protected readonly error = signal('');
  protected readonly chipTone = chipTone;
  protected readonly filterTone = filterTone;

  protected readonly status = computed(() => (this.dev === 'empty' ? 'empty' : this.view().status));
  protected readonly subtitle = computed(() =>
    this.status() === 'empty' ? 'Your first weekend lands here once Sunday is over.' : this.view().subtitle,
  );

  constructor() {
    if (this.dev !== 'empty') void this.run(() => this.saved.load());
  }

  protected setFilter(label: string): void {
    this.saved.setFilter(label);
  }

  protected favourite(card: PastWeekendCard, favourite: boolean): Promise<void> {
    return this.run(() => this.saved.setFavourite(card.id, favourite));
  }

  protected async rename(card: PastWeekendCard): Promise<void> {
    const ref = this.dialog.open<RenameWeekendDialogResult, RenameWeekendDialogData>(RenameWeekendDialog, {
      ...DIALOG_OPTIONS,
      data: { eyebrow: card.eyebrow, title: card.customTitle },
    });
    const result = await firstValueFrom(ref.closed);
    if (!result) return;
    await this.run(() => this.saved.rename(card.id, result.title));
  }

  protected async rate(card: PastWeekendCard): Promise<void> {
    const ref = this.dialog.open<RatingDialogResult, RatingDialogData>(RatingDialog, {
      ...DIALOG_OPTIONS,
      data: { eyebrow: `${card.eyebrow} · ${card.title}`, rating: card.rating || null },
    });
    const result = await firstValueFrom(ref.closed);
    if (!result) return;
    await this.run(() => this.saved.rate(card.id, result.rating));
  }

  protected async repeat(card: PastWeekendCard): Promise<void> {
    const ok = await confirmWith(this.dialog, {
      title: 'Use this weekend again?',
      body: 'It replaces the current draft. Saved weekends stay.',
      well: {
        icon: 'refresh',
        tone: 'warn',
        title: 'The current draft goes away',
        body: 'Locks and family settings stay.',
      },
      confirmLabel: 'Replace draft',
      danger: true,
    });
    if (!ok) return;
    await this.run(async () => {
      await this.weekend.repeatSaved(card.id);
      await this.router.navigateByUrl('/weekend');
    });
  }

  protected async remix(card: PastWeekendCard): Promise<void> {
    const ok = await confirmWith(this.dialog, {
      title: 'Remix this weekend?',
      body: 'Same shape, new places.',
      well: {
        icon: 'sparkle',
        title: 'What changes',
        body: 'The same rhythm with new picks. Commitments and locked blocks stay.',
      },
      confirmLabel: 'Remix',
      icon: 'sparkle',
    });
    if (!ok) return;
    await this.run(async () => {
      await this.weekend.remixSaved(card.id);
      await this.router.navigateByUrl('/weekend');
    });
  }

  private async run(work: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await work();
    } catch (err) {
      this.error.set('That did not go through. Try again in a moment.');
      console.error('PastPage action failed', err);
    }
  }
}
