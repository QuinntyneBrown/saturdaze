import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  CreateEmailTemplateRequest,
  EMAIL_TEMPLATE_CATEGORIES,
  EMAIL_TEMPLATE_KEY_PATTERN,
  EmailTemplateCategory,
  suggestTemplateKey,
} from 'api';
import { Banner, Button, Dialog as DialogShell, Icon, Select, TextInput } from 'components';

import { templateErrorMessage } from '../../shared/template-errors';

export interface NewTemplateDialogData {
  /** Duplicate: the template whose content the new draft copies; its category stays fixed. */
  readonly source?: {
    readonly id: string;
    readonly name: string;
    readonly category: EmailTemplateCategory;
  };
  /** Sends the request; resolves with the new template's id, rejects with the server's error. */
  readonly create: (request: CreateEmailTemplateRequest) => Promise<string>;
}

/** The new template's id. */
export type NewTemplateDialogResult = string;

/**
 * AD7 — New email template (docs/mocks/pages/dialogs.html#dialog-admin-new-template),
 * also the Duplicate flow from A9. Name, key, category and description; the
 * key follows the name until it is edited (L2-132 AC5). A taken key or a
 * field error shows in place and keeps the dialog open (AC4).
 */
@Component({
  selector: 'sd-admin-new-template-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, Banner, Button, DialogShell, Icon, Select, TextInput],
  templateUrl: './new-template-dialog.html',
  styleUrl: './new-template-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewTemplateDialog {
  private readonly dialogRef = inject<DialogRef<NewTemplateDialogResult>>(DialogRef);
  protected readonly data = inject<NewTemplateDialogData>(DIALOG_DATA);

  protected readonly duplicating = !!this.data.source;
  protected readonly categories = EMAIL_TEMPLATE_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  private readonly initialName = this.data.source ? `Copy of ${this.data.source.name}` : '';

  protected readonly form = new FormGroup({
    name: new FormControl(this.initialName, { nonNullable: true }),
    key: new FormControl(suggestTemplateKey(this.initialName), { nonNullable: true }),
    category: new FormControl<EmailTemplateCategory>(this.data.source?.category ?? 'Notification', {
      nonNullable: true,
    }),
    description: new FormControl('', { nonNullable: true }),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  /** True once the administrator typed a key of their own; the name stops driving it. */
  private keyEdited = false;
  protected readonly error = signal('');
  protected readonly sending = signal(false);

  protected readonly keyError = computed(() => {
    const key = (this.value().key ?? '').trim();
    return key && !EMAIL_TEMPLATE_KEY_PATTERN.test(key)
      ? 'Use lowercase letters and digits in words joined by dots or hyphens.'
      : '';
  });

  protected readonly canSave = computed(
    () =>
      !this.sending() &&
      !!this.value().name?.trim() &&
      !!this.value().key?.trim() &&
      !this.keyError(),
  );

  constructor() {
    if (this.duplicating) this.form.controls.category.disable();
    this.form.controls.name.valueChanges.pipe(takeUntilDestroyed()).subscribe((name) => {
      if (!this.keyEdited) this.form.controls.key.setValue(suggestTemplateKey(name));
    });
    this.form.controls.key.valueChanges.pipe(takeUntilDestroyed()).subscribe((key) => {
      this.keyEdited = key !== suggestTemplateKey(this.form.controls.name.value);
      this.error.set('');
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async save(event?: Event): Promise<void> {
    event?.preventDefault();
    if (!this.canSave()) return;
    const { name, key, category, description } = this.form.getRawValue();
    this.sending.set(true);
    this.error.set('');
    try {
      const id = await this.data.create({
        key: key.trim(),
        name: name.trim(),
        description: description.trim(),
        category,
        ...(this.data.source ? { duplicateOf: this.data.source.id } : {}),
      });
      this.dialogRef.close(id);
    } catch (err) {
      this.error.set(templateErrorMessage(err));
    } finally {
      this.sending.set(false);
    }
  }
}
