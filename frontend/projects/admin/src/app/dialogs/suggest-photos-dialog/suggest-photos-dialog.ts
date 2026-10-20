import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { PhotoDetails, PhotoSuggestionView } from 'api';
import {
  Banner,
  Button,
  Dialog as DialogShell,
  Icon,
  PhotoSuggestionTile,
  PhotoSuggestions,
  PhotoSuggestionsState,
  Select,
  TextInput,
} from 'components';

import { LICENCE_OPTIONS, LICENCE_OTHER, licenceChoice } from '../../shared/licences';
import { FAILED, errorCode, uploadErrorMessage } from '../../shared/upload-errors';

export interface SuggestPhotosDialogData {
  readonly placeName: string;
  /** Asks the API for photos of the place on the web (L2-157); rejects with the server's error. */
  readonly suggest: (query: string) => Promise<readonly PhotoSuggestionView[]>;
  /** Keeps the picked suggestion with the confirmed details; rejects with the server's error (L2-159). */
  readonly add: (suggestionId: string, details: PhotoDetails) => Promise<void>;
}

export type SuggestPhotosDialogResult = 'added';

const SUGGEST_FAILED = 'Photo suggestions are not available right now. Try again in a moment.';
const SUGGESTION_GONE = 'That suggestion is no longer available. Search again.';

/**
 * AD7 — Suggested photos (docs/mocks/pages/dialogs.html#dialog-admin-suggest).
 * The search starts from the place name; picking a tile fills alt text,
 * attribution and licence from what Claude read on the source page, which
 * the administrator checks before saving. Save stays disabled until a
 * suggestion is picked and attribution and licence are filled (L2-159).
 */
@Component({
  selector: 'sd-admin-suggest-photos-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Banner,
    Button,
    DialogShell,
    Icon,
    PhotoSuggestions,
    Select,
    TextInput,
  ],
  templateUrl: './suggest-photos-dialog.html',
  styleUrl: './suggest-photos-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SuggestPhotosDialog {
  private readonly dialogRef = inject<DialogRef<SuggestPhotosDialogResult>>(DialogRef);
  protected readonly data = inject<SuggestPhotosDialogData>(DIALOG_DATA);

  protected readonly licences = LICENCE_OPTIONS;

  protected readonly form = new FormGroup({
    alt: new FormControl('', { nonNullable: true }),
    attribution: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    licence: new FormControl('CC BY 4.0', { nonNullable: true }),
    licenceText: new FormControl('', { nonNullable: true }),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  protected readonly state = signal<PhotoSuggestionsState>('idle');
  protected readonly suggestError = signal(SUGGEST_FAILED);
  protected readonly suggestions = signal<readonly PhotoSuggestionView[]>([]);
  protected readonly selected = signal<string | null>(null);
  protected readonly error = signal('');
  protected readonly sending = signal(false);

  protected readonly tiles = computed<PhotoSuggestionTile[]>(() =>
    this.suggestions().map((s) => ({
      id: s.id,
      src: s.media.src,
      caption: s.sourceName,
      label: `${s.title} · ${s.sourceName}`,
    })),
  );
  protected readonly picked = computed(
    () => this.suggestions().find((s) => s.id === this.selected()) ?? null,
  );
  protected readonly isOther = computed(() => this.value().licence === LICENCE_OTHER);
  protected readonly licence = computed(() => {
    const v = this.value();
    return (v.licence === LICENCE_OTHER ? (v.licenceText ?? '') : (v.licence ?? '')).trim();
  });
  protected readonly canSave = computed(
    () =>
      !this.sending() &&
      !!this.picked() &&
      !!this.value().attribution?.trim() &&
      this.licence().length > 0,
  );

  protected async suggest(query: string): Promise<void> {
    this.state.set('loading');
    this.error.set('');
    try {
      const found = await this.data.suggest(query);
      this.suggestions.set(found);
      this.selected.set(null);
      this.state.set('done');
    } catch (err) {
      this.suggestions.set([]);
      this.selected.set(null);
      this.suggestError.set(
        errorCode(err) === 'suggestion_limit' ? limitMessage(err) : SUGGEST_FAILED,
      );
      this.state.set('error');
    }
  }

  /** A picked tile fills the details; the administrator may change them before saving. */
  protected pick(id: string): void {
    this.selected.set(id);
    const s = this.suggestions().find((x) => x.id === id);
    if (!s) return;
    const choice = licenceChoice(s.licence);
    this.form.patchValue({
      alt: s.title,
      attribution: s.attribution,
      licence: choice,
      licenceText: choice === LICENCE_OTHER ? s.licence : '',
    });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected async save(event?: Event): Promise<void> {
    event?.preventDefault();
    const picked = this.picked();
    if (!picked || !this.canSave()) return;
    this.sending.set(true);
    this.error.set('');
    const { alt, attribution } = this.form.getRawValue();
    try {
      await this.data.add(picked.id, {
        alt: alt.trim(),
        attribution: attribution.trim(),
        licence: this.licence(),
      });
      this.dialogRef.close('added');
    } catch (err) {
      this.error.set(
        errorCode(err) === 'suggestion_not_found'
          ? SUGGESTION_GONE
          : uploadErrorMessage(err) || FAILED,
      );
    } finally {
      this.sending.set(false);
    }
  }
}

function limitMessage(err: unknown): string {
  const detail = (err as { error?: { detail?: unknown } } | null)?.error?.detail;
  return typeof detail === 'string' ? detail : SUGGEST_FAILED;
}
