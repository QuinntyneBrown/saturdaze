import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormsModule } from '@angular/forms';

import { MemberAccess } from 'api';
import {
  Button,
  Dialog as DialogShell,
  Icon,
  SegRadio,
  SegRadioOption,
  TextInput,
} from 'components';

import { trimmedEmail } from '../../shared/trimmed-email.validator';

export interface FamilyMemberDialogData {
  readonly mode: 'add' | 'edit';
  readonly initial?: { readonly name: string; readonly age: number };
  readonly existingNames: readonly string[];
  /** Edit mode: how the member signs in, for the read-only access hint (L2-124). */
  readonly access?: MemberAccess;
  readonly email?: string | null;
  /** Add mode: the preselected sign-in choice (the gallery's D17b invite specimen). */
  readonly signIn?: 'none' | 'invite';
}

export type FamilyMemberDialogResult =
  | {
      readonly kind: 'save';
      readonly name: string;
      readonly age: number;
      /** Add mode: the address to invite, or `null` for a member who won't sign in. */
      readonly email: string | null;
    }
  | { readonly kind: 'remove' };

type SignIn = 'none' | 'invite';

const SIGN_IN_OPTIONS: readonly SegRadioOption[] = [
  { value: 'none', label: 'No sign-in' },
  { value: 'invite', label: 'Invite to sign in' },
];

/**
 * D17 — add or edit a family member: name + age (the role is derived from
 * the age). Adding (D17b) also asks "Will they sign in?": "No sign-in" by
 * default (L2-125), or "Invite to sign in" with an email (L2-126). Edit mode
 * names how the member signs in and offers Remove on the left; the page runs
 * the D21 confirmation.
 */
@Component({
  selector: 'app-family-member-dialog',
  standalone: true,
  imports: [Button, DialogShell, FormsModule, Icon, SegRadio, TextInput],
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
  protected readonly signInOptions = SIGN_IN_OPTIONS;
  protected readonly accessHint =
    this.data.email && this.data.access === 'Account'
      ? `Signs in as ${this.data.email}`
      : this.data.email && this.data.access === 'Invited'
        ? `Invite sent to ${this.data.email}`
        : '';

  protected readonly name = signal(this.data.initial?.name ?? '');
  protected readonly signIn = signal<SignIn>(this.data.signIn ?? 'none');
  protected readonly email = signal('');
  protected readonly emailError = signal('');
  protected readonly inviting = computed(() => !this.isEdit && this.signIn() === 'invite');
  protected readonly submitLabel = computed(() =>
    this.isEdit ? 'Save' : this.inviting() ? 'Send invite' : 'Add member',
  );
  protected readonly signInHint = computed(() =>
    this.inviting()
      ? "They'll choose their own password from the invite link."
      : 'No invite is sent. Good for young children.',
  );
  protected readonly age = signal<string>(this.data.initial ? String(this.data.initial.age) : '');
  protected readonly error = signal('');

  protected readonly ageHint = computed(() => {
    const age = Number(this.age());
    if (!this.age().trim() || !Number.isFinite(age)) return 'Under 18 counts as a kid.';
    return age < 18 ? 'Kid · under 18 counts as a kid.' : 'Parent · 18 and over.';
  });

  protected readonly canSubmit = computed(
    () =>
      this.name().trim().length > 0 &&
      this.age().trim().length > 0 &&
      (!this.inviting() || this.email().trim().length > 0),
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
    const email = this.inviting() ? this.email().trim() : null;
    if (email !== null && trimmedEmail({ value: email } as AbstractControl<string>)) {
      this.emailError.set('Enter an email address like name@example.com.');
      return;
    }
    this.dialogRef.close({ kind: 'save', name, age, email });
  }
}
