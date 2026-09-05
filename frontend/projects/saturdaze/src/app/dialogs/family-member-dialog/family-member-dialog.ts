import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button, Dialog as DialogShell, Icon, TextInput } from 'components';

export interface FamilyMemberDialogData {
  readonly mode: 'add' | 'edit';
  readonly initial?: { readonly name: string; readonly age: number };
  readonly existingNames: readonly string[];
}

export type FamilyMemberDialogResult =
  | { readonly kind: 'save'; readonly name: string; readonly age: number }
  | { readonly kind: 'remove' };

/**
 * D17 — add or edit a family member: name + age (the API stores nothing
 * else; the role is derived from the age). Edit mode offers Remove on the
 * left; the page runs the D21 confirmation.
 */
@Component({
  selector: 'app-family-member-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon, TextInput],
  templateUrl: './family-member-dialog.html',
  styleUrl: './family-member-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMemberDialog {
  private readonly dialogRef = inject<DialogRef<FamilyMemberDialogResult>>(DialogRef);
  protected readonly data = inject<FamilyMemberDialogData>(DIALOG_DATA);

  protected readonly isEdit = this.data.mode === 'edit';
  protected readonly title = this.isEdit
    ? `Edit ${this.data.initial?.name ?? 'family member'}`
    : 'Add a family member';
  protected readonly submitLabel = this.isEdit ? 'Save' : 'Add member';

  protected readonly name = signal(this.data.initial?.name ?? '');
  protected readonly age = signal<string>(this.data.initial ? String(this.data.initial.age) : '');
  protected readonly error = signal('');

  protected readonly ageHint = computed(() => {
    const age = Number(this.age());
    if (!this.age().trim() || !Number.isFinite(age)) return 'Under 18 counts as a kid.';
    return age < 18 ? 'Kid · under 18 counts as a kid.' : 'Parent · 18 and over.';
  });

  protected readonly canSubmit = computed(
    () => this.name().trim().length > 0 && this.age().trim().length > 0,
  );

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected remove(): void {
    this.dialogRef.close({ kind: 'remove' });
  }

  protected submit(event?: Event): void {
    event?.preventDefault();
    const name = this.name().trim();
    const age = Number(this.age());

    if (!name) {
      this.error.set('Enter a name.');
      return;
    }
    if (!Number.isInteger(age) || age < 0 || age > 120) {
      this.error.set('Enter an age between 0 and 120.');
      return;
    }
    const lower = name.toLowerCase();
    const originalLower = this.data.initial?.name.toLowerCase() ?? null;
    const collides = this.data.existingNames.some(
      (n) => n.toLowerCase() === lower && n.toLowerCase() !== originalLower,
    );
    if (collides) {
      this.error.set('Someone in the family already has that name.');
      return;
    }
    this.dialogRef.close({ kind: 'save', name, age });
  }
}
