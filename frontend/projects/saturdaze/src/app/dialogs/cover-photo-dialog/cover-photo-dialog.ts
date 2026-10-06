import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';

import { CoverChoice, CoverSelection } from 'api';
import { Banner, Button, Dialog as DialogShell, Icon } from 'components';

export interface CoverPhotoDialogData {
  readonly choices: readonly CoverChoice[];
  /** The place whose photo is the cover now, if any. */
  readonly currentPlaceId: string | null;
  /** Sends the family's photo as the cover; rejects with the server's error (L2-109). */
  readonly upload: (file: Blob) => Promise<void>;
}

/** A stop or the default rule for the page to apply, or a family photo already uploaded. */
export type CoverPhotoDialogResult = CoverSelection | { readonly source: 'uploaded' };

/** The upload limit the API enforces (L2-109 AC3). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD = 'upload';

const TOO_LARGE = 'That photo is over 10 MB. Choose a smaller one.';
const NOT_A_PHOTO = 'That file is not a photo we can use. Choose a JPEG, PNG or WebP.';
const FAILED = 'The photo did not upload. Try again in a moment.';

/**
 * D29 — "Cover photo" (L2-108 AC2, L2-109, L2-110 AC2): every stop's photo
 * as a radio tile, plus "Your own photo". Opened from the Weekend cover and
 * from a Past card. A family photo is checked here, uploaded from
 * here, and server refusals are shown in place so the family can pick again.
 */
@Component({
  selector: 'app-cover-photo-dialog',
  standalone: true,
  imports: [Banner, Button, DialogShell, Icon],
  templateUrl: './cover-photo-dialog.html',
  styleUrl: './cover-photo-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverPhotoDialog {
  private readonly dialogRef = inject<DialogRef<CoverPhotoDialogResult>>(DialogRef);
  protected readonly data = inject<CoverPhotoDialogData>(DIALOG_DATA);
  protected readonly upload = UPLOAD;

  protected readonly selected = signal<string | null>(
    this.data.currentPlaceId ?? this.data.choices[0]?.placeId ?? null,
  );
  private readonly file = signal<File | null>(null);
  protected readonly preview = signal<string | null>(null);
  protected readonly error = signal('');
  private readonly sending = signal(false);
  protected readonly canUse = computed(
    () =>
      !this.sending() &&
      (this.selected() === UPLOAD ? !!this.file() && !this.error() : !!this.selected()),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  protected choose(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.revokePreview();
    this.selected.set(UPLOAD);
    this.error.set('');
    this.file.set(null);
    // Checked before sending: the server enforces the same rules (L2-109 AC2, AC3).
    if (file.size > MAX_UPLOAD_BYTES) {
      this.error.set(TOO_LARGE);
      return;
    }
    if (!ACCEPTED.includes(file.type)) {
      this.error.set(NOT_A_PHOTO);
      return;
    }
    this.file.set(file);
    this.preview.set(URL.createObjectURL(file));
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async use(): Promise<void> {
    if (this.selected() !== UPLOAD) {
      const placeId = this.selected();
      if (placeId) this.dialogRef.close({ source: 'stop', placeId });
      return;
    }
    const file = this.file();
    if (!file) return;
    this.sending.set(true);
    try {
      await this.data.upload(file);
      this.dialogRef.close({ source: 'uploaded' });
    } catch (err) {
      this.error.set(messageFor(err));
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

function messageFor(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return FAILED;
  if (err.status === 413) return TOO_LARGE;
  if (err.status === 400 && err.error?.code === 'unsupported_image') return NOT_A_PHOTO;
  return FAILED;
}
