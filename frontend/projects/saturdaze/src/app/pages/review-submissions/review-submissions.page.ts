import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { EVENT_SUBMISSIONS_SERVICE, SubmissionCard } from 'api';
import {
  Avatar,
  Banner,
  Button,
  Card,
  Chip,
  DateTile,
  DetailItem,
  Details,
  Empty,
  Icon,
  PageHeader,
  StatusRow,
} from 'components';

import {
  ApproveSubmissionDialog,
  ApproveSubmissionDialogData,
  ApproveSubmissionDialogResult,
} from '../../dialogs/approve-submission-dialog/approve-submission-dialog';
import { DIALOG_OPTIONS } from '../../dialogs/confirm-dialog/confirm-dialog';
import {
  RejectSubmissionDialog,
  RejectSubmissionDialogData,
  RejectSubmissionDialogResult,
} from '../../dialogs/reject-submission-dialog/reject-submission-dialog';
import { devState } from '../../shared/dev-state';

/**
 * Review submissions — `docs/mocks-v2/pages/review-submissions.html`
 * (admin only): the pending queue, oldest first, each card with Reject /
 * Approve. Approved cards collapse to an "Approved · title" row.
 */
@Component({
  selector: 'app-review-submissions',
  standalone: true,
  imports: [Avatar, Banner, Button, Card, Chip, DateTile, Details, Empty, Icon, PageHeader, StatusRow],
  templateUrl: './review-submissions.page.html',
  styleUrl: './review-submissions.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewSubmissionsPage {
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);
  private readonly dialog = inject(Dialog);
  private readonly route = inject(ActivatedRoute);

  private readonly dev = devState(this.route);

  protected readonly view = this.submissions.review();
  protected readonly error = signal('');

  protected readonly status = computed(() => (this.dev === 'empty' ? 'empty' : this.view().status));
  protected readonly subtitle = computed(() =>
    this.status() === 'empty'
      ? 'Nothing waiting. New suggestions show up here as families send them.'
      : this.view().subtitle,
  );

  constructor() {
    if (this.dev !== 'empty') void this.run(() => this.submissions.loadPending());
  }

  protected details(card: SubmissionCard): DetailItem[] {
    return [
      { label: 'Location', value: card.location },
      { label: 'Cost', value: card.cost },
      { label: 'Ages', value: card.ages },
      { label: 'Link', value: card.link, href: card.dto.sourceUrl ?? undefined },
      { label: 'Notes', value: card.notes },
    ];
  }

  protected async approve(card: SubmissionCard): Promise<void> {
    const ref = this.dialog.open<ApproveSubmissionDialogResult, ApproveSubmissionDialogData>(
      ApproveSubmissionDialog,
      { ...DIALOG_OPTIONS, data: { card } },
    );
    const result = await firstValueFrom(ref.closed);
    if (result !== 'confirm') return;
    await this.run(async () => {
      await this.submissions.approve(card.id);
    });
  }

  protected async reject(card: SubmissionCard): Promise<void> {
    const ref = this.dialog.open<RejectSubmissionDialogResult, RejectSubmissionDialogData>(
      RejectSubmissionDialog,
      { ...DIALOG_OPTIONS, data: { card } },
    );
    const result = await firstValueFrom(ref.closed);
    if (!result) return;
    await this.run(async () => {
      await this.submissions.reject(card.id, result.reason || null);
    });
  }

  private async run(work: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await work();
    } catch (err) {
      this.error.set('That did not go through. Try again in a moment.');
      console.error('ReviewSubmissionsPage action failed', err);
    }
  }
}
