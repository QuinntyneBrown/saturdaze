import { Dialog } from '@angular/cdk/dialog';
import { firstValueFrom } from 'rxjs';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';

import {
  EVENT_SUBMISSIONS_SERVICE,
  EventSubmissionDto,
} from 'api';
import {
  Avatar,
  BottomNav,
  Button,
  Chip,
  Icon,
  TagGroup,
  TopBar,
} from 'components';

import {
  ApproveSubmissionDialog,
  ApproveSubmissionDialogResult,
} from '../../dialogs/approve-submission-dialog/approve-submission-dialog';
import {
  RejectSubmissionDialog,
  RejectSubmissionDialogResult,
} from '../../dialogs/reject-submission-dialog/reject-submission-dialog';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [Avatar, BottomNav, Button, Chip, Icon, TagGroup, TopBar],
  templateUrl: './admin-events.page.html',
  styleUrl: './admin-events.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEventsPage implements OnInit {
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);
  private readonly dialog = inject(Dialog);

  protected readonly pending = this.submissions.pending();

  protected readonly pendingCount = computed(() => this.pending().length);

  ngOnInit(): void {
    void this.submissions.loadPending();
  }

  protected formatWhen(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: d.getMinutes() === 0 ? undefined : '2-digit',
    });
  }

  protected submittedAgo(iso: string): string {
    const submitted = new Date(iso);
    const now = Date.now();
    const diff = Math.max(0, now - submitted.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  protected async openApprove(submission: EventSubmissionDto): Promise<void> {
    const ref = this.dialog.open<ApproveSubmissionDialogResult>(ApproveSubmissionDialog, {
      data: { submission },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    const result = await firstValueFrom(ref.closed);
    if (result === 'approve') {
      await this.submissions.approve(submission.id);
    }
  }

  protected async openReject(submission: EventSubmissionDto): Promise<void> {
    const ref = this.dialog.open<RejectSubmissionDialogResult>(RejectSubmissionDialog, {
      data: { submission },
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    const result = await firstValueFrom(ref.closed);
    if (result) {
      await this.submissions.reject(submission.id, result.reason);
    }
  }
}
