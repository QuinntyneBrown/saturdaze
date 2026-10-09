import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { EmailRevisionRow, EmailTemplateRevisionDto } from 'api';
import { Banner, Button, Dialog as DialogShell, StatusRow } from 'components';

import { templateErrorMessage } from '../../shared/template-errors';

export interface TemplateHistoryDialogData {
  readonly templateName: string;
  /** The template's revisions, newest first. */
  readonly list: () => Promise<EmailRevisionRow[]>;
  /** One revision's full content. */
  readonly load: (version: number) => Promise<EmailTemplateRevisionDto>;
}

/** The revision to put in the editor, unsaved. */
export type TemplateHistoryDialogResult = EmailTemplateRevisionDto;

/**
 * AD9 — Template history (docs/mocks/pages/dialogs.html#dialog-admin-template-history).
 * Every create, save and status change, newest first; "Load into editor"
 * closes with that revision's content so the page can put it in the form
 * unsaved — saving makes it the next version (L2-136 AC4).
 */
@Component({
  selector: 'sd-admin-template-history-dialog',
  standalone: true,
  imports: [Banner, Button, DialogShell, StatusRow],
  templateUrl: './template-history-dialog.html',
  styleUrl: './template-history-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateHistoryDialog {
  private readonly dialogRef = inject<DialogRef<TemplateHistoryDialogResult>>(DialogRef);
  protected readonly data = inject<TemplateHistoryDialogData>(DIALOG_DATA);

  protected readonly rows = signal<EmailRevisionRow[] | null>(null);
  protected readonly error = signal('');
  protected readonly loading = signal<number | null>(null);
  protected readonly subtitle = `${this.data.templateName} · every create, save and status change. Loading a version puts it in the editor; saving makes it the next version.`;

  constructor() {
    void this.fetch();
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected async loadVersion(version: number): Promise<void> {
    if (this.loading() !== null) return;
    this.loading.set(version);
    this.error.set('');
    try {
      this.dialogRef.close(await this.data.load(version));
    } catch (err) {
      this.error.set(templateErrorMessage(err));
    } finally {
      this.loading.set(null);
    }
  }

  private async fetch(): Promise<void> {
    try {
      this.rows.set(await this.data.list());
    } catch (err) {
      this.rows.set([]);
      this.error.set(templateErrorMessage(err));
    }
  }
}
