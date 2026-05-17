import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Button, Dialog as DialogShell, Icon } from 'components';

export interface FamilyMemberDialogData {
  readonly mode: 'add' | 'edit';
  readonly initial?: { readonly name: string; readonly age: number };
  readonly existingNames: readonly string[];
}

export interface FamilyMemberDialogResult {
  readonly name: string;
  readonly age: number;
}

@Component({
  selector: 'app-family-member-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon],
  templateUrl: './family-member-dialog.html',
  styleUrl: './family-member-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMemberDialog {
  private readonly dialogRef =
    inject<DialogRef<FamilyMemberDialogResult>>(DialogRef);
  protected readonly data = inject<FamilyMemberDialogData>(DIALOG_DATA);

  protected readonly title =
    this.data.mode === 'add'
      ? 'Add a family member'
      : `Edit ${this.data.initial?.name ?? 'family member'}`;
  protected readonly subtitle =
    this.data.mode === 'add' ? "I'll plan around their age and likes" : 'Update name or age';
  protected readonly submitLabel = this.data.mode === 'add' ? 'Add member' : 'Save';

  protected readonly name = signal(this.data.initial?.name ?? '');
  protected readonly age = signal<number | string>(this.data.initial?.age ?? 5);
  protected readonly error = signal('');
  protected readonly canSubmit = computed(() => this.name().trim().length > 0);

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const name = this.name().trim();
    const age = Number(this.age());

    if (!name) {
      this.error.set('Enter a family member name.');
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
      this.error.set('Family member names must be unique.');
      return;
    }

    this.dialogRef.close({ name, age });
  }
}
