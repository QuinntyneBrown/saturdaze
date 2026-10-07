import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ADMIN_PHOTOS_SERVICE, ADMIN_PLACES_SERVICE, ReviewItemView, numberWord } from 'api';
import { Banner, Button, Card, Chip, Empty, Icon, Media, PageHeader, StatusRow } from 'components';

import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
import {
  MakePrimaryDialog,
  MakePrimaryDialogData,
  MakePrimaryDialogResult,
} from '../../dialogs/make-primary-dialog/make-primary-dialog';
import {
  RejectPhotoDialog,
  RejectPhotoDialogData,
  RejectPhotoDialogResult,
} from '../../dialogs/reject-photo-dialog/reject-photo-dialog';

type Status = 'loading' | 'ready';

/** "Seven provider photos ingestion brought in" · "One provider photo …" (the mock's subtitle). */
export function queueSubtitle(count: number): string {
  if (count === 0)
    return 'Nothing waiting. Every provider photo has been kept, promoted or rejected.';
  const word = numberWord(count);
  const n = word.charAt(0).toUpperCase() + word.slice(1);
  return `${n} provider photo${count === 1 ? '' : 's'} ingestion brought in, newest first. Keep, make primary, or reject in one step each.`;
}

/**
 * Review queue (A5) — `docs/mocks/pages/admin.reviews.html`: unreviewed
 * provider photos newest first, each beside the primary it would replace,
 * with Keep, Make primary (AD4) and Reject (AD6) in one step (L2-120).
 * A decided item leaves the list.
 */
@Component({
  selector: 'sd-admin-review-queue',
  standalone: true,
  imports: [RouterLink, Banner, Button, Card, Chip, Empty, Icon, Media, PageHeader, StatusRow],
  templateUrl: './review-queue.page.html',
  styleUrl: './review-queue.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewQueuePage {
  private readonly photos = inject(ADMIN_PHOTOS_SERVICE);
  private readonly places = inject(ADMIN_PLACES_SERVICE);
  private readonly dialog = inject(Dialog);

  protected readonly status = signal<Status>('loading');
  protected readonly items = signal<ReviewItemView[]>([]);
  protected readonly error = signal('');
  /** Ids with a decision in flight, so a double tap sends one request (L2-120 AC4). */
  protected readonly busy = signal<ReadonlySet<string>>(new Set());

  protected readonly subtitle = computed(() =>
    this.status() === 'loading'
      ? 'Fetching what ingestion brought in.'
      : queueSubtitle(this.items().length),
  );

  constructor() {
    void this.load();
  }

  protected isBusy(item: ReviewItemView): boolean {
    return this.busy().has(item.id);
  }

  /** Keep: reviewed, nothing else changes (L2-120 AC2). */
  protected keep(item: ReviewItemView): Promise<void> {
    return this.decide(item, () => this.photos.review(item.id, 'keep'));
  }

  /** Make primary: AD4 with the cover impact, then reviewed and primary (L2-120 AC2, L2-117 AC2). */
  protected async makePrimary(item: ReviewItemView): Promise<void> {
    if (this.isBusy(item)) return;
    let coverImpact = 0;
    try {
      coverImpact = (await this.places.photos(item.kind, item.placeId)).coverImpact;
    } catch (err) {
      console.error('ReviewQueuePage cover impact failed', err);
    }
    const ref = this.dialog.open<MakePrimaryDialogResult, MakePrimaryDialogData>(
      MakePrimaryDialog,
      {
        ...DIALOG_OPTIONS,
        data: { media: item.candidate, placeName: item.placeName, coverImpact },
      },
    );
    if ((await firstValueFrom(ref.closed)) !== 'confirm') return;
    await this.decide(item, () => this.photos.review(item.id, 'primary'));
  }

  /** Reject: AD6 with an optional reason, then the photo goes for good (L2-120 AC3, AC4). */
  protected async reject(item: ReviewItemView): Promise<void> {
    if (this.isBusy(item)) return;
    const ref = this.dialog.open<RejectPhotoDialogResult, RejectPhotoDialogData>(
      RejectPhotoDialog,
      {
        ...DIALOG_OPTIONS,
        data: { media: item.candidate, placeName: item.placeName },
      },
    );
    const result = await firstValueFrom(ref.closed);
    if (!result) return;
    await this.decide(item, () =>
      this.photos.review(item.id, 'reject', result.reason || undefined),
    );
  }

  private async decide(item: ReviewItemView, work: () => Promise<void>): Promise<void> {
    if (this.isBusy(item)) return;
    this.error.set('');
    this.busy.update((b) => new Set(b).add(item.id));
    try {
      await work();
      this.items.update((list) => list.filter((i) => i.id !== item.id));
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 409 || status === 404) {
        // Decided elsewhere meanwhile: it is no longer in the queue.
        this.items.update((list) => list.filter((i) => i.id !== item.id));
      } else {
        this.error.set('That did not go through. Try again in a moment.');
        console.error('ReviewQueuePage decision failed', err);
      }
    } finally {
      this.busy.update((b) => {
        const next = new Set(b);
        next.delete(item.id);
        return next;
      });
    }
  }

  private async load(): Promise<void> {
    this.status.set('loading');
    this.error.set('');
    try {
      this.items.set(await this.photos.reviews());
    } catch (err) {
      this.error.set('Could not load the queue. Try again in a moment.');
      console.error('ReviewQueuePage load failed', err);
    } finally {
      this.status.set('ready');
    }
  }
}
