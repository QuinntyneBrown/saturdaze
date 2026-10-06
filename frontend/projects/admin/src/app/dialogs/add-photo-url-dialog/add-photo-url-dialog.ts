import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PhotoDetails } from 'api';
import { Banner, Button, Dialog as DialogShell, Icon, Select, TextInput } from 'components';

import { LICENCE_OPTIONS, LICENCE_OTHER } from '../../shared/licences';
import {
  FAILED,
  PHOTO_EXISTS,
  URL_NOT_ALLOWED,
  URL_NOT_IMAGE,
  errorCode,
  uploadErrorMessage,
} from '../../shared/upload-errors';

export interface AddPhotoUrlDialogData {
  readonly placeName: string;
  /** Sends the address and its details; rejects with the server's error (L2-116). */
  readonly add: (url: string, details: PhotoDetails) => Promise<void>;
}

export type AddPhotoUrlDialogResult = 'added';

/** Only HTTPS can be on the allow-list; anything else is refused before it is sent (L2-116 AC1). */
function isHttps(value: string): boolean {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * AD2 — Add photo · from URL (docs/mocks/pages/dialogs.html#dialog-admin-url).
 * HTTPS on an allowed origin only; the server fetches the image once to
 * check its type and size. A refused address shows its reason under the
 * field and keeps Save disabled until the address changes.
 */
@Component({
  selector: 'sd-admin-add-photo-url-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, Banner, Button, DialogShell, Icon, Select, TextInput],
  templateUrl: './add-photo-url-dialog.html',
  styleUrl: './add-photo-url-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPhotoUrlDialog {
  private readonly dialogRef = inject<DialogRef<AddPhotoUrlDialogResult>>(DialogRef);
  protected readonly data = inject<AddPhotoUrlDialogData>(DIALOG_DATA);

  protected readonly licences = LICENCE_OPTIONS;

  protected readonly form = new FormGroup({
    url: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    alt: new FormControl('', { nonNullable: true }),
    attribution: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    licence: new FormControl('CC BY 4.0', { nonNullable: true }),
    licenceText: new FormControl('', { nonNullable: true }),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  /** The address the server refused, with its reason; cleared when the address changes. */
  private readonly refused = signal<{ url: string; reason: string } | null>(null);
  protected readonly error = signal('');
  protected readonly sending = signal(false);

  protected readonly url = computed(() => (this.value().url ?? '').trim());
  protected readonly urlError = computed(() => {
    const url = this.url();
    if (!url) return '';
    if (!isHttps(url)) return URL_NOT_ALLOWED;
    const refused = this.refused();
    return refused && refused.url === url ? refused.reason : '';
  });
  protected readonly isOther = computed(() => this.value().licence === LICENCE_OTHER);
  protected readonly licence = computed(() => {
    const v = this.value();
    return (v.licence === LICENCE_OTHER ? (v.licenceText ?? '') : (v.licence ?? '')).trim();
  });
  protected readonly canSave = computed(
    () =>
      !this.sending() &&
      this.url().length > 0 &&
      !this.urlError() &&
      !!this.value().attribution?.trim() &&
      this.licence().length > 0,
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async save(event?: Event): Promise<void> {
    event?.preventDefault();
    if (!this.canSave()) return;
    const url = this.url();
    const { alt, attribution } = this.form.getRawValue();
    this.sending.set(true);
    this.error.set('');
    try {
      await this.data.add(url, {
        alt: alt.trim(),
        attribution: attribution.trim(),
        licence: this.licence(),
      });
      this.dialogRef.close('added');
    } catch (err) {
      const code = errorCode(err);
      if (code === 'url_not_allowed') this.refused.set({ url, reason: URL_NOT_ALLOWED });
      else if (code === 'unsupported_image') this.refused.set({ url, reason: URL_NOT_IMAGE });
      else if (code === 'photo_exists') this.refused.set({ url, reason: PHOTO_EXISTS });
      else this.error.set(uploadErrorMessage(err) || FAILED);
    } finally {
      this.sending.set(false);
    }
  }
}
