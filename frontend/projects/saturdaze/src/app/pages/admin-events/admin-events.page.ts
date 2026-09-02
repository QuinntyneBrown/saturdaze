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
  formatWhen,
  timeAgo,
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
    return formatWhen(iso, 'full');
  }

  protected submittedAgo(iso: string): string {
    return timeAgo(iso);
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
