import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ADMIN_INVITATIONS_SERVICE, InvitationRow, ProspectRow } from 'api';
import {
  Banner,
  Button,
  Chip,
  Disc,
  DiscTone,
  Empty,
  Icon,
  List,
  ListItem,
  PageHeader,
  Section,
  StatusRow,
} from 'components';

import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
import {
  InviteDialog,
  InviteDialogData,
  InviteDialogResult,
} from '../../dialogs/invite-dialog/invite-dialog';
import {
  RevokeInviteDialog,
  RevokeInviteDialogData,
  RevokeInviteDialogResult,
} from '../../dialogs/revoke-invite-dialog/revoke-invite-dialog';
import { chipTone } from '../../shared/chip-tones';

type Status = 'loading' | 'ready';

/** "6 invites" · "1 invite". */
export function inviteCount(n: number): string {
  return `${n} invite${n === 1 ? '' : 's'}`;
}

/**
 * Invitations (A8) — `docs/mocks/pages/admin.invitations.html`: the sample
 * weekends an administrator described and every invite sent, newest first.
 * "Invite families" opens AD7 (L2-157); "Revoke" on a pending row opens AD8
 * (L2-158).
 */
@Component({
  selector: 'sd-admin-invitations',
  standalone: true,
  imports: [
    Banner,
    Button,
    Chip,
    Disc,
    Empty,
    Icon,
    List,
    ListItem,
    PageHeader,
    Section,
    StatusRow,
  ],
  templateUrl: './invitations.page.html',
  styleUrl: './invitations.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationsPage {
  private readonly service = inject(ADMIN_INVITATIONS_SERVICE);
  private readonly dialog = inject(Dialog);

  protected readonly status = signal<Status>('loading');
  protected readonly invitations = signal<InvitationRow[]>([]);
  protected readonly prospects = signal<ProspectRow[]>([]);
  protected readonly error = signal('');
  protected readonly chipTone = chipTone;

  protected readonly countText = computed(() => inviteCount(this.invitations().length));

  constructor() {
    void this.load();
  }

  /** The disc beside an invite row follows its status chip. */
  protected discTone(row: InvitationRow): DiscTone {
    const tone = row.status.tone;
    return tone === 'sun' || tone === 'accent' || tone === 'warn' ? tone : 'default';
  }

  protected discIcon(row: InvitationRow): string {
    return row.status.icon ?? (row.status.tone === 'warn' ? 'alert' : 'mail');
  }

  protected prospectDiscTone(row: ProspectRow): DiscTone {
    return row.status.tone === 'accent' ? 'accent' : 'primary';
  }

  /** AD7: the dialog sends; the new rows go to the top (L2-157 AC9). */
  protected async invite(): Promise<void> {
    const ref = this.dialog.open<InviteDialogResult, InviteDialogData>(InviteDialog, {
      ...DIALOG_OPTIONS,
      data: {
        prospects: this.prospects(),
        send: (request) => this.service.send(request),
      },
    });
    const rows = await firstValueFrom(ref.closed);
    if (!rows?.length) return;
    this.invitations.update((list) => [...rows, ...list]);
    // A prospect's status moves to Invited once it is named by an invite.
    if (rows.some((r) => r.sample !== 'No sample weekend')) void this.refreshProspects();
  }

  /** AD8, then the row re-reads as Revoked (L2-158 AC5). */
  protected async revoke(row: InvitationRow): Promise<void> {
    const ref = this.dialog.open<RevokeInviteDialogResult, RevokeInviteDialogData>(
      RevokeInviteDialog,
      { ...DIALOG_OPTIONS, data: { email: row.email } },
    );
    if ((await firstValueFrom(ref.closed)) !== 'revoke') return;
    this.error.set('');
    try {
      await this.service.revoke(row.id);
      this.invitations.set(await this.service.list());
    } catch (err) {
      this.error.set('The invite was not revoked. Try again in a moment.');
      console.error('InvitationsPage revoke failed', err);
    }
  }

  private async load(): Promise<void> {
    this.error.set('');
    try {
      const [invitations, prospects] = await Promise.all([
        this.service.list(),
        this.service.prospects(),
      ]);
      this.invitations.set(invitations);
      this.prospects.set(prospects);
      this.status.set('ready');
    } catch (err) {
      this.error.set('Could not load the invitations. Try again in a moment.');
      this.status.set('ready');
      console.error('InvitationsPage load failed', err);
    }
  }

  private async refreshProspects(): Promise<void> {
    try {
      this.prospects.set(await this.service.prospects());
    } catch (err) {
      console.error('InvitationsPage prospects refresh failed', err);
    }
  }
}
