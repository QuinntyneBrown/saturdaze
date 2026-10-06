import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';

import { Avatar, Button, Dialog as DialogShell, Icon } from 'components';

export interface ProfilePhotoDialogData {
  /** The account email; the preview falls back to its initial. */
  readonly name: string;
  /** The current photo, or `null` while the initial shows. */
  readonly currentUrl: string | null;
}

export interface ProfilePhotoDialogResult {
  readonly kind: 'save';
  readonly file: File;
}

/**
 * D27 — "Profile photo" (L2-087). Previews the picked image and closes with
 * it; the page performs the upload.
 */
@Component({
  selector: 'app-profile-photo-dialog',
  standalone: true,
  imports: [Avatar, Button, DialogShell, Icon],
  templateUrl: './profile-photo-dialog.html',
  styleUrl: './profile-photo-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePhotoDialog {
  private readonly dialogRef = inject<DialogRef<ProfilePhotoDialogResult>>(DialogRef);
  protected readonly data = inject<ProfilePhotoDialogData>(DIALOG_DATA);

  protected readonly file = signal<File | null>(null);
  private readonly pickedUrl = signal<string | null>(null);
  protected readonly previewUrl = computed(() => this.pickedUrl() ?? this.data.currentUrl);
  protected readonly canSave = computed(() => this.file() !== null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePicked());
  }

  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    this.revokePicked();
    this.file.set(file);
    this.pickedUrl.set(URL.createObjectURL(file));
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    const file = this.file();
    if (!file) return;
    this.dialogRef.close({ kind: 'save', file });
  }

  private revokePicked(): void {
    const url = this.pickedUrl();
    if (url) URL.revokeObjectURL(url);
    this.pickedUrl.set(null);
  }
}
