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

import { CoverChoice, CoverSelection, PhotoSuggestionView } from 'api';
import {
  Banner,
  Button,
  Dialog as DialogShell,
  Icon,
  PhotoDrop,
  PhotoPick,
  PhotoPickOption,
  PhotoSuggestionTile,
  PhotoSuggestions,
  PhotoSuggestionsState,
} from 'components';

export interface CoverPhotoDialogData {
  readonly choices: readonly CoverChoice[];
  /** The place whose photo is the cover now, if any. */
  readonly currentPlaceId: string | null;
  /** Sends the family's photo as the cover; rejects with the server's error (L2-109). */
  readonly upload: (file: Blob) => Promise<void>;
  /** Asks the API for photos of this weekend on the web (L2-158); rejects with the server's error. */
  readonly suggest: (query: string) => Promise<readonly PhotoSuggestionView[]>;
}

/** A stop or the default rule for the page to apply, or a family photo already uploaded. */
export type CoverPhotoDialogResult = CoverSelection | { readonly source: 'uploaded' };

/** The upload limit the API enforces (L2-109 AC3). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD = 'upload';

const SUGGEST_FAILED = 'Photo suggestions are not available right now. Try again in a moment.';
const TOO_LARGE = 'That photo is over 10 MB. Choose a smaller one.';
const NOT_A_PHOTO = 'That file is not a photo we can use. Choose a JPEG, PNG or WebP.';
const FAILED = 'The photo did not upload. Try again in a moment.';

/**
 * D29 — "Cover photo" (L2-108 AC2, L2-109, L2-110 AC2, L2-158): every stop's
 * photo as a radio tile, plus "Your own photo" and, on request, photos
 * Claude found on the web under "From the web". Opened from the Weekend
 * cover and from a Past card. A family photo is checked here, uploaded from
 * here, and server refusals are shown in place so the family can pick again.
 */
@Component({
  selector: 'app-cover-photo-dialog',
  standalone: true,
  imports: [
    Banner,
    Button,
    DialogShell,
    Icon,
    PhotoDrop,
    PhotoPick,
    PhotoPickOption,
    PhotoSuggestions,
  ],
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

  // "From the web" (L2-158): the search runs here; the tiles join the same radio group.
  protected readonly suggestState = signal<PhotoSuggestionsState>('idle');
  protected readonly suggestError = signal(SUGGEST_FAILED);
  private readonly suggestions = signal<readonly PhotoSuggestionView[]>([]);
  protected readonly suggestionTiles = computed<PhotoSuggestionTile[]>(() =>
    this.suggestions().map((s) => ({
      id: s.id,
      src: s.media.src,
      caption: s.sourceName,
      label: `${s.title} · ${s.sourceName}`,
    })),
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePreview());
  }

  protected choose(file: File): void {
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

  protected async suggest(query: string): Promise<void> {
    this.suggestState.set('loading');
    try {
      const found = await this.data.suggest(query);
      this.suggestions.set(found);
      this.suggestState.set('done');
      if (found.length && this.selected() === null) this.selected.set(found[0].id);
    } catch (err) {
      this.suggestions.set([]);
      this.suggestError.set(suggestMessageFor(err));
      this.suggestState.set('error');
    }
  }

  protected async use(): Promise<void> {
    if (this.selected() !== UPLOAD) {
      const chosen = this.selected();
      if (!chosen) return;
      if (this.suggestions().some((s) => s.id === chosen)) {
        this.dialogRef.close({ source: 'suggestion', suggestionId: chosen });
      } else {
        this.dialogRef.close({ source: 'stop', placeId: chosen });
      }
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

function suggestMessageFor(err: unknown): string {
  if (
    err instanceof HttpErrorResponse &&
    err.status === 429 &&
    typeof err.error?.detail === 'string'
  ) {
    return err.error.detail;
  }
  return SUGGEST_FAILED;
}
