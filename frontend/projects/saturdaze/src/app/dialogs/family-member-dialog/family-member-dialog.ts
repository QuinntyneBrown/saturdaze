import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AbstractControl, FormsModule } from '@angular/forms';

import { MemberAccess } from 'api';
import {
  Button,
  Checkbox,
  ChipInput,
  Dialog as DialogShell,
  ErrorSummary,
  ErrorSummaryProblem,
  Icon,
  SegRadio,
  SegRadioOption,
  TextInput,
} from 'components';

import { trimmedEmail } from '../../shared/trimmed-email.validator';

export interface FamilyMemberDialogData {
  readonly mode: 'add' | 'edit';
  readonly initial?: {
    readonly name: string;
    readonly age: number;
    readonly interests?: readonly string[];
  };
  readonly existingNames: readonly string[];
  /** Edit mode: how the member signs in, for the read-only access hint (L2-124). */
  readonly access?: MemberAccess;
  readonly email?: string | null;
  /** Add mode: the preselected sign-in choice (the gallery's D17b invite specimen). */
  readonly signIn?: 'none' | 'invite';
  /**
   * The owner's sign-in email while they are not in "Who's in" (L2-216): add
   * mode offers the "This is me" checkbox, edit mode of a member with no
   * access offers the "This is me" button. Unset once the owner is linked.
   */
  readonly selfEmail?: string | null;
  /** Add mode: open with "This is me" ticked (the "Add yourself" row, L2-217). */
  readonly self?: boolean;
  /** Edit mode: the row is the viewer's own; it is never removed (L2-218). */
  readonly isSelf?: boolean;
}

export type FamilyMemberDialogResult =
  | {
      readonly kind: 'save';
      readonly name: string;
      readonly age: number;
      /** Add mode: the address to invite, or `null` for a member who won't sign in. */
      readonly email: string | null;
      /** Up to 8; picks that match get a boost for this person (L2-196). */
      readonly interests: readonly string[];
      /** Add mode: "This is me" was ticked; the member is the owner (L2-216). */
      readonly self?: boolean;
    }
  | { readonly kind: 'claim' }
  | { readonly kind: 'remove' };

/** The API keeps at most eight interests per member (L2-196). */
export const MAX_INTERESTS = 8;

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
 * the D21 confirmation. When adding, the action stays enabled: pressing it
 * with a gap shows an error summary instead (L2-134). While the owner is not
 * in "Who's in", adding offers a "This is me" checkbox and editing a member
 * with no access a "This is me" button (L2-216); the owner's own row has no
 * Remove (L2-218).
 */
@Component({
  selector: 'app-family-member-dialog',
  standalone: true,
  imports: [
    Button,
    Checkbox,
    ChipInput,
    DialogShell,
    ErrorSummary,
    FormsModule,
    Icon,
    SegRadio,
    TextInput,
  ],
  templateUrl: './family-member-dialog.html',
  styleUrl: './family-member-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyMemberDialog {
  private readonly dialogRef = inject<DialogRef<FamilyMemberDialogResult>>(DialogRef);
  protected readonly data = inject<FamilyMemberDialogData>(DIALOG_DATA);
  private readonly injector = inject(Injector);
  private readonly summary = viewChild(ErrorSummary);
  private readonly nameField = viewChild<TextInput>('nameField');
  private readonly ageField = viewChild<TextInput>('ageField');
  private readonly emailField = viewChild<TextInput>('emailField');

  protected readonly isEdit = this.data.mode === 'edit';
  protected readonly title = this.isEdit
    ? `Edit ${this.data.initial?.name ?? 'family member'}`
    : 'Add a family member';
  protected readonly signInOptions = SIGN_IN_OPTIONS;
  protected readonly accessHint =
    this.data.isSelf && this.data.email
      ? `This is you. Signs in as ${this.data.email}`
      : this.data.email && this.data.access === 'Account'
        ? `Signs in as ${this.data.email}`
        : this.data.email && this.data.access === 'Invited'
          ? `Invite sent to ${this.data.email}`
          : '';

  protected readonly name = signal(this.data.initial?.name ?? '');
  protected readonly signIn = signal<SignIn>(this.data.signIn ?? 'none');
  protected readonly email = signal('');
  protected readonly interests = signal<readonly string[]>(this.data.initial?.interests ?? []);
  protected readonly interestsError = computed(() =>
    this.interests().length > MAX_INTERESTS ? `Keep it to ${MAX_INTERESTS} interests.` : '',
  );
  /** Add mode: the "This is me" checkbox is offered (L2-216). */
  protected readonly canBeSelf = !this.isEdit && !!this.data.selfEmail;
  /** Edit mode: the "This is me" button is offered for a member with no access (L2-216). */
  protected readonly canClaim =
    this.isEdit &&
    !!this.data.selfEmail &&
    !this.data.isSelf &&
    (this.data.access ?? 'None') === 'None';
  protected readonly selfHint = `Linked to your account, ${this.data.selfEmail ?? ''}. No invite is sent.`;
  protected readonly claimHint = `Links ${this.data.initial?.name ?? 'them'} to your account, ${this.data.selfEmail ?? ''}.`;
  protected readonly isMe = signal(this.canBeSelf && !!this.data.self);
  protected readonly inviting = computed(
    () => !this.isEdit && !this.isMe() && this.signIn() === 'invite',
  );
  protected readonly submitLabel = computed(() =>
    this.isEdit ? 'Save' : this.isMe() ? 'Add me' : this.inviting() ? 'Send invite' : 'Add member',
  );
  protected readonly signInHint = computed(() =>
    this.inviting()
      ? "They'll choose their own password from the invite link."
      : 'No invite is sent. Good for young children.',
  );
  protected readonly age = signal<string>(this.data.initial ? String(this.data.initial.age) : '');
  /** Set by the first press of the action; from then on the summary tracks the fields. */
  private readonly attempted = signal(false);

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

  /** What is wrong, once a press was tried; each line leaves as its field is fixed. */
  protected readonly problems = computed<ErrorSummaryProblem[]>(() => {
    if (!this.attempted()) return [];
    const found: ErrorSummaryProblem[] = [];
    const name = this.name().trim();
    const age = Number(this.age());
    if (!name) {
      found.push({ id: 'name', message: 'Enter a name' });
    } else {
      const lower = name.toLowerCase();
      const originalLower = this.data.initial?.name.toLowerCase() ?? null;
      const collides = this.data.existingNames.some(
        (n) => n.toLowerCase() === lower && n.toLowerCase() !== originalLower,
      );
      if (collides)
        found.push({ id: 'name', message: 'Someone in the family already has that name' });
    }
    if (!this.age().trim()) {
      found.push({ id: 'age', message: 'Enter an age between 0 and 120' });
    } else if (!Number.isInteger(age) || age < 0 || age > 120) {
      found.push({ id: 'age', message: 'Enter an age between 0 and 120' });
    }
    if (this.inviting()) {
      const email = this.email().trim();
      if (!email || trimmedEmail({ value: email } as AbstractControl<string>)) {
        found.push({ id: 'email', message: 'Enter an email address like name@example.com' });
      }
    }
    return found;
  });

  protected readonly nameError = computed(() => this.errorFor('name'));
  protected readonly ageError = computed(() => this.errorFor('age'));
  protected readonly emailError = computed(() => this.errorFor('email'));

  private errorFor(id: string): string {
    const problem = this.problems().find((p) => p.id === id);
    return problem ? `${problem.message}.` : '';
  }

  protected focusField(id: string): void {
    (id === 'name'
      ? this.nameField()
      : id === 'age'
        ? this.ageField()
        : this.emailField()
    )?.focus();
  }

  protected cancel(): void {
    this.dialogRef.close();
  }

  protected remove(): void {
    this.dialogRef.close({ kind: 'remove' });
  }

  protected claim(): void {
    this.dialogRef.close({ kind: 'claim' });
  }

  protected submit(event?: Event): void {
    event?.preventDefault();
    this.attempted.set(true);
    if (this.interestsError()) return;
    if (this.problems().length > 0) {
      afterNextRender(() => this.summary()?.focus(), { injector: this.injector });
      return;
    }
    const email = this.inviting() ? this.email().trim() : null;
    this.dialogRef.close({
      kind: 'save',
      name: this.name().trim(),
      age: Number(this.age()),
      email,
      interests: this.interests(),
      ...(this.isMe() ? { self: true } : {}),
    });
  }
}
