import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { InvitationRow, ProspectRow, SendInvitationsRequest } from 'api';
import {
  Banner,
  Button,
  ChipInput,
  Dialog as DialogShell,
  Icon,
  Select,
  SelectOption,
  TextInput,
} from 'components';

import { serverMessage } from '../../shared/server-errors';

export interface InviteDialogData {
  /** The sample weekends AD7 offers; the first option is always "none". */
  readonly prospects: readonly ProspectRow[];
  /** Preselects a sample weekend (A10's "Send invite"). */
  readonly prospectId?: string | null;
  /** Sends the batch; rejects with the server's error (L2-157). */
  readonly send: (request: SendInvitationsRequest) => Promise<InvitationRow[]>;
}

/** The rows the server created, newest first. */
export type InviteDialogResult = InvitationRow[];

export const NO_SAMPLE = '';
export const NO_ADDRESS = 'Enter at least one email address';
export const SEND_FAILED = 'The invites did not send. Try again in a moment.';

/**
 * AD7 — Invite families to Saturdaze (docs/mocks/pages/dialogs.html#dialog-admin-invite).
 * Addresses as chips, an optional sample weekend and an optional message.
 * The batch succeeds or fails as one; a refused address shows the server's
 * reason above the form (L2-157 AC3, AC9, AC10).
 */
@Component({
  selector: 'sd-admin-invite-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, Banner, Button, ChipInput, DialogShell, Icon, Select, TextInput],
  templateUrl: './invite-dialog.html',
  styleUrl: './invite-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteDialog {
  private readonly dialogRef = inject<DialogRef<InviteDialogResult>>(DialogRef);
  protected readonly data = inject<InviteDialogData>(DIALOG_DATA);

  protected readonly sampleOptions: readonly SelectOption[] = [
    { value: NO_SAMPLE, label: 'None · they start from an empty family' },
    ...this.data.prospects.map((p) => ({ value: p.id, label: p.optionLabel })),
  ];

  protected readonly form = new FormGroup({
    emails: new FormControl<string[]>([], { nonNullable: true }),
    prospectId: new FormControl(this.data.prospectId ?? NO_SAMPLE, { nonNullable: true }),
    message: new FormControl('', { nonNullable: true }),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  protected readonly error = signal('');
  protected readonly sending = signal(false);
  protected readonly count = computed(() => this.value().emails?.length ?? 0);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async send(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.sending()) return;
    const { emails, prospectId, message } = this.form.getRawValue();
    if (emails.length === 0) {
      this.error.set(NO_ADDRESS);
      return;
    }
    this.sending.set(true);
    this.error.set('');
    try {
      const rows = await this.data.send({
        emails,
        prospectId: prospectId || null,
        message: message.trim() || null,
      });
      this.dialogRef.close(rows);
    } catch (err) {
      this.error.set(serverMessage(err) || SEND_FAILED);
    } finally {
      this.sending.set(false);
    }
  }
}
