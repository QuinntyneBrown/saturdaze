import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PhotoDetails } from 'api';
import { Banner, Button, Dialog as DialogShell, Icon, Select, TextInput } from 'components';

import { LICENCE_OPTIONS, LICENCE_OTHER } from '../../shared/licences';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  NOT_A_PHOTO,
  TOO_LARGE,
  uploadErrorMessage,
} from '../../shared/upload-errors';

export interface UploadPhotoDialogData {
  readonly placeName: string;
  /** Sends the photo and its details; rejects with the server's error (L2-115). */
  readonly upload: (file: Blob, details: PhotoDetails) => Promise<void>;
}

export type UploadPhotoDialogResult = 'uploaded';

/** "memorial-park.jpg · 3.1 MB · 1200 × 675" for the chosen file. */
function describe(file: File, width: number | null, height: number | null): string {
  const mb = (file.size / (1024 * 1024)).toFixed(1);
  const size = width && height ? ` · ${width} × ${height}` : '';
  return `${file.name} · ${mb} MB${size}`;
}

/**
 * AD1 — Add photo · upload (docs/mocks/pages/dialogs.html#dialog-admin-upload).
 * The file is checked here before sending (type, 10 MB); the server enforces
 * the same rules and strips metadata. Save stays disabled until a photo,
 * attribution and licence are in place (L2-115 AC4). Server refusals show
 * in place so the curator can pick again.
 */
@Component({
  selector: 'sd-admin-upload-photo-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, Banner, Button, DialogShell, Icon, Select, TextInput],
  templateUrl: './upload-photo-dialog.html',
  styleUrl: './upload-photo-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadPhotoDialog {
  private readonly dialogRef = inject<DialogRef<UploadPhotoDialogResult>>(DialogRef);
  protected readonly data = inject<UploadPhotoDialogData>(DIALOG_DATA);

  protected readonly licences = LICENCE_OPTIONS;
  protected readonly other = LICENCE_OTHER;

  protected readonly form = new FormGroup({
    alt: new FormControl('', { nonNullable: true }),
    attribution: new FormControl('Photo · Saturdaze', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    licence: new FormControl('Saturdaze owned', { nonNullable: true }),
    licenceText: new FormControl('', { nonNullable: true }),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  private readonly file = signal<File | null>(null);
  protected readonly preview = signal<string | null>(null);
  protected readonly fileLabel = signal('');
  protected readonly error = signal('');
  protected readonly sending = signal(false);

  protected readonly isOther = computed(() => this.value().licence === LICENCE_OTHER);
  protected readonly licence = computed(() => {
    const v = this.value();
    return (v.licence === LICENCE_OTHER ? (v.licenceText ?? '') : (v.licence ?? '')).trim();
  });
  protected readonly canSave = computed(
    () =>
      !this.sending() &&
      !!this.file() &&
      !!this.value().attribution?.trim() &&
      this.licence().length > 0,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  protected choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.revokePreview();
    this.error.set('');
    this.file.set(null);
    this.fileLabel.set('');
    if (file.size > MAX_UPLOAD_BYTES) {
      this.error.set(TOO_LARGE);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      this.error.set(NOT_A_PHOTO);
      return;
    }
    this.file.set(file);
    this.fileLabel.set(describe(file, null, null));
    const src = URL.createObjectURL(file);
    this.preview.set(src);
    const image = new Image();
    image.onload = () =>
      this.fileLabel.set(describe(file, image.naturalWidth, image.naturalHeight));
    image.src = src;
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async save(event?: Event): Promise<void> {
    event?.preventDefault();
    const file = this.file();
    if (!file || !this.canSave()) return;
    this.sending.set(true);
    this.error.set('');
    const { alt, attribution } = this.form.getRawValue();
    try {
      await this.data.upload(file, {
        alt: alt.trim(),
        attribution: attribution.trim(),
        licence: this.licence(),
      });
      this.dialogRef.close('uploaded');
    } catch (err) {
      this.error.set(uploadErrorMessage(err));
    } finally {
      this.sending.set(false);
    }
  }

  private revokePreview(): void {
    const src = this.preview();
    if (src) URL.revokeObjectURL(src);
    this.preview.set(null);
  }
}
