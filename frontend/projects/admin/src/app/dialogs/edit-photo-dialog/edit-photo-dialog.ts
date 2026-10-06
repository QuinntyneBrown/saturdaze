import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

import { PhotoDetails, PhotoTileView } from 'api';
import { Button, Dialog as DialogShell, Icon, Media, Select, TextInput } from 'components';

import { LICENCE_OPTIONS, LICENCE_OTHER, licenceChoice } from '../../shared/licences';

export interface EditPhotoDialogData {
  readonly tile: PhotoTileView;
}

export type EditPhotoDialogResult = PhotoDetails;

/** Trimmed, non-blank. */
const notBlank = Validators.pattern(/\S/);

/**
 * AD3 — Edit photo details (docs/mocks/pages/dialogs.html#dialog-admin-edit).
 * Alt text, attribution and licence; the address cannot change (L2-118).
 * Save stays disabled until attribution and licence are filled (AC2).
 */
@Component({
  selector: 'sd-admin-edit-photo-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, Button, DialogShell, Icon, Media, Select, TextInput],
  templateUrl: './edit-photo-dialog.html',
  styleUrl: './edit-photo-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditPhotoDialog {
  private readonly dialogRef = inject<DialogRef<EditPhotoDialogResult>>(DialogRef);
  protected readonly data = inject<EditPhotoDialogData>(DIALOG_DATA);

  protected readonly licences = LICENCE_OPTIONS;
  protected readonly other = LICENCE_OTHER;

  protected readonly form = new FormGroup({
    alt: new FormControl(this.data.tile.alt, { nonNullable: true }),
    attribution: new FormControl(this.data.tile.credit, {
      nonNullable: true,
      validators: [Validators.required, notBlank],
    }),
    licence: new FormControl(licenceChoice(this.data.tile.licence), { nonNullable: true }),
    licenceText: new FormControl(
      licenceChoice(this.data.tile.licence) === LICENCE_OTHER ? this.data.tile.licence : '',
      { nonNullable: true },
    ),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly isOther = computed(() => this.value().licence === LICENCE_OTHER);

  /** The licence to save: the chosen entry, or the free text behind "Other". */
  protected readonly licence = computed(() => {
    const v = this.value();
    return (v.licence === LICENCE_OTHER ? (v.licenceText ?? '') : (v.licence ?? '')).trim();
  });

  protected readonly canSave = computed(
    () => !!this.value().attribution?.trim() && this.licence().length > 0,
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected save(event?: Event): void {
    event?.preventDefault();
    if (!this.canSave()) return;
    const { alt, attribution } = this.form.getRawValue();
    this.dialogRef.close({
      alt: alt.trim(),
      attribution: attribution.trim(),
      licence: this.licence(),
    });
  }
}
