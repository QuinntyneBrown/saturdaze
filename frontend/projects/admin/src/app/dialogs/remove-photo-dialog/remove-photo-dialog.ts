import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { PhotoTileView } from 'api';
import { Button, Dialog as DialogShell, Icon, Media, PhotoPick, PhotoPickOption } from 'components';

import { coverImpactWarning } from '../make-primary-dialog/make-primary-dialog';

export interface RemovePhotoDialogData {
  readonly tile: PhotoTileView;
  /** The place's other photos, in tile order. */
  readonly siblings: readonly PhotoTileView[];
  readonly placeName: string;
  readonly coverImpact: number;
}

/** The next primary when the primary goes: a sibling's id or `'none'`; null for a non-primary removal. */
export interface RemovePhotoDialogResult {
  readonly nextPrimaryId: string | null;
}

export const NO_PHOTO = 'none';

/**
 * The default next primary (L2-119): the next curated photo, else the next
 * reviewed provider photo, else no photo.
 */
export function defaultNextPrimary(siblings: readonly PhotoTileView[]): string {
  const curated = siblings.find((s) => s.source === 'Curated' && !s.blocked);
  if (curated) return curated.id;
  const reviewed = siblings.find((s) => s.source === 'Provider' && !s.unreviewed && !s.blocked);
  return reviewed?.id ?? NO_PHOTO;
}

/** "Curated · The bandshell" for the picker tiles. */
export function optionLabel(tile: PhotoTileView): string {
  const source =
    tile.source === 'Provider'
      ? tile.unreviewed
        ? 'Provider · unreviewed'
        : 'Provider'
      : tile.source;
  return tile.alt ? `${source} · ${tile.alt}` : source;
}

/**
 * AD5 — Remove photo (docs/mocks/pages/dialogs.html#dialog-admin-remove).
 * A non-primary photo just confirms. Removing the primary makes the
 * administrator pick what families see next: a sibling or "No photo"
 * (L2-119 AC1).
 */
@Component({
  selector: 'sd-admin-remove-photo-dialog',
  standalone: true,
  imports: [Button, DialogShell, Icon, Media, PhotoPick, PhotoPickOption],
  templateUrl: './remove-photo-dialog.html',
  styleUrl: './remove-photo-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemovePhotoDialog {
  private readonly dialogRef = inject<DialogRef<RemovePhotoDialogResult>>(DialogRef);
  protected readonly data = inject<RemovePhotoDialogData>(DIALOG_DATA);
  protected readonly noPhoto = NO_PHOTO;
  protected readonly optionLabel = optionLabel;

  protected readonly isPrimary = this.data.tile.isPrimary;
  protected readonly title = this.isPrimary ? 'Remove the primary photo?' : 'Remove this photo?';
  protected readonly subtitle =
    this.data.tile.source === 'Curated' && this.data.tile.url.includes('/api/catalog-photos/')
      ? 'Its file is deleted. Choose what families see next.'
      : 'The photo leaves the catalog; its source is untouched.';
  protected readonly next = signal<string>(defaultNextPrimary(this.data.siblings));
  protected readonly impact = computed(() =>
    this.data.coverImpact === 0
      ? 'No weekend covers follow this place.'
      : `${coverImpactWarning(this.data.coverImpact).replace(' will change', '')} follow this place and will show the next primary.`,
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected remove(): void {
    this.dialogRef.close({ nextPrimaryId: this.isPrimary ? this.next() : null });
  }
}
