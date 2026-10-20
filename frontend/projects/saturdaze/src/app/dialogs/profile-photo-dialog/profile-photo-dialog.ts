import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';

import { PhotoSuggestionView } from 'api';
import {
  Avatar,
  Button,
  Dialog as DialogShell,
  Icon,
  PhotoSuggestionTile,
  PhotoSuggestions,
  PhotoSuggestionsState,
} from 'components';

/** Mirrors the API's rules (L2-087); the server re-checks the file's content. */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

export interface ProfilePhotoDialogData {
  /** The account email; the preview falls back to its initial. */
  readonly name: string;
  /** The current photo, or `null` while the initial shows. */
  readonly currentUrl: string | null;
  /** Asks the API for photos matching a description (L2-160); rejects with the server's error. */
  readonly suggest: (query: string) => Promise<readonly PhotoSuggestionView[]>;
}

export type ProfilePhotoDialogResult =
  | { readonly kind: 'save'; readonly file: File }
  | { readonly kind: 'suggestion'; readonly suggestionId: string }
  | { readonly kind: 'remove' };

const SUGGEST_FAILED = 'Photo suggestions are not available right now. Try again in a moment.';

/**
 * D27 — "Profile photo" (L2-087, L2-160). Previews the picked image, or a
 * photo found on the web for a typed description, and closes with it, or
 * with `remove` when a photo is set; the page performs the call.
 */
@Component({
  selector: 'app-profile-photo-dialog',
  standalone: true,
  imports: [Avatar, Button, DialogShell, Icon, PhotoSuggestions],
  templateUrl: './profile-photo-dialog.html',
  styleUrl: './profile-photo-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePhotoDialog {
  private readonly dialogRef = inject<DialogRef<ProfilePhotoDialogResult>>(DialogRef);
  protected readonly data = inject<ProfilePhotoDialogData>(DIALOG_DATA);

  protected readonly file = signal<File | null>(null);
  protected readonly error = signal('');
  private readonly pickedUrl = signal<string | null>(null);

  // "Find a photo" (L2-160): the search runs here; a picked tile previews in the avatar.
  protected readonly suggestState = signal<PhotoSuggestionsState>('idle');
  protected readonly suggestError = signal(SUGGEST_FAILED);
  private readonly suggestions = signal<readonly PhotoSuggestionView[]>([]);
  protected readonly selectedSuggestion = signal<string | null>(null);
  protected readonly suggestionTiles = computed<PhotoSuggestionTile[]>(() =>
    this.suggestions().map((s) => ({
      id: s.id,
      src: s.media.src,
      caption: s.sourceName,
      label: `${s.title} · ${s.sourceName}`,
    })),
  );
  private readonly suggestionUrl = computed(
    () => this.suggestions().find((s) => s.id === this.selectedSuggestion())?.media.src ?? null,
  );

  protected readonly previewUrl = computed(
    () => this.pickedUrl() ?? this.suggestionUrl() ?? this.data.currentUrl,
  );
  protected readonly canSave = computed(
    () => this.file() !== null || this.selectedSuggestion() !== null,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.revokePicked());
  }

  protected pick(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) return;
    this.revokePicked();
    const error = !ACCEPTED_TYPES.includes(file.type)
      ? 'That file is not a JPG, PNG or WebP image.'
      : file.size > MAX_BYTES
        ? 'That photo is over 2 MB. Choose a smaller one.'
        : '';
    this.error.set(error);
    if (error) {
      this.file.set(null);
      return;
    }
    this.file.set(file);
    this.selectedSuggestion.set(null);
    this.pickedUrl.set(URL.createObjectURL(file));
  }

  protected async suggest(query: string): Promise<void> {
    this.suggestState.set('loading');
    try {
      const found = await this.data.suggest(query);
      this.suggestions.set(found);
      this.selectedSuggestion.set(null);
      this.suggestState.set('done');
    } catch {
      this.suggestions.set([]);
      this.selectedSuggestion.set(null);
      this.suggestError.set(SUGGEST_FAILED);
      this.suggestState.set('error');
    }
  }

  /** A suggestion replaces a file picked earlier, and shows in the preview. */
  protected pickSuggestion(id: string): void {
    this.revokePicked();
    this.file.set(null);
    this.error.set('');
    this.selectedSuggestion.set(id);
  }

  protected remove(): void {
    this.dialogRef.close({ kind: 'remove' });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(): void {
    const file = this.file();
    if (file) {
      this.dialogRef.close({ kind: 'save', file });
      return;
    }
    const suggestionId = this.selectedSuggestion();
    if (suggestionId) this.dialogRef.close({ kind: 'suggestion', suggestionId });
  }

  private revokePicked(): void {
    const url = this.pickedUrl();
    if (url) URL.revokeObjectURL(url);
    this.pickedUrl.set(null);
  }
}
