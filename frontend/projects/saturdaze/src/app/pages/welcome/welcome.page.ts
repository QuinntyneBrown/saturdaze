import { Dialog } from '@angular/cdk/dialog';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';

import { EditableFamilyProfile, FAMILY_SERVICE, FamilyInvite, MemberRow, SESSION_STORE } from 'api';
import {
  AuthCard,
  AuthShell,
  Avatar,
  Banner,
  Button,
  ChipInput,
  Disc,
  GhostRow,
  Icon,
  List,
  ListItem,
  Stepper,
  TextInput,
  Toggle,
} from 'components';

import { DIALOG_OPTIONS, confirmWith } from '../../dialogs/confirm-dialog/confirm-dialog';
import {
  FamilyMemberDialog,
  FamilyMemberDialogData,
  FamilyMemberDialogResult,
} from '../../dialogs/family-member-dialog/family-member-dialog';
import {
  InviteLinkDialog,
  InviteLinkDialogData,
} from '../../dialogs/invite-link-dialog/invite-link-dialog';

import { maskEmail } from '../../shared/mask-email';

import { environment } from '../../../environments/environment';

/**
 * Welcome — `docs/mocks/pages/welcome.html`, the onboarding wizard a new
 * account lands in (L1-039). One route per step, `/welcome/:step`: home,
 * family, likes, preferences and done. Every step saves as it is
 * completed through the family profile; Skip moves on without saving.
 */

export type WizardStep = 'home' | 'family' | 'likes' | 'preferences' | 'done';

export const WIZARD_STEPS: readonly WizardStep[] = [
  'home',
  'family',
  'likes',
  'preferences',
  'done',
];

/** The steps the stepper counts: everything but the closing screen. */
const COUNTED_STEPS = WIZARD_STEPS.length - 1;

const SAVE_FAILED = 'That did not save. Try again in a moment.';

/** Why adding a member was refused (L2-125 #3, L2-126 #3, #4), as on Family. */
function addMemberError(err: unknown): string {
  const code = (err as { error?: { code?: string } } | null)?.error?.code;
  switch (code) {
    case 'email_in_use':
      return 'That email already signs in to Saturdaze.';
    case 'already_invited':
      return 'That email already has an invite to this family.';
    case 'member_name_in_use':
      return 'Someone in the family already has that name.';
    case 'already_in_family':
      return "You're already in Who's in.";
    case 'member_has_access':
      return 'That member is already invited or signs in.';
    default:
      return SAVE_FAILED;
  }
}

/** The "Add yourself" row's line (L2-217), as on Family. */
function addYourselfSubtitle(members: readonly MemberRow[]): string {
  return members.some((m) => m.access === 'None')
    ? "You're not in Who's in yet. Already listed? Tap your name and choose This is me."
    : "You're not in Who's in yet. Weekends plan for you once you are.";
}

/** D21 body for removing a member, by how they sign in (L2-128). */
function removalConsequence(member: MemberRow): string {
  if (member.access === 'Account')
    return `${member.name} will be signed out and will no longer be able to sign in.`;
  if (member.access === 'Invited' && member.email)
    return `The invite sent to ${member.email} will stop working.`;
  return 'Future weekends will not plan for them.';
}

function isWizardStep(value: string | null): value is WizardStep {
  return (WIZARD_STEPS as readonly string[]).includes(value ?? '');
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    AuthShell,
    AuthCard,
    Avatar,
    Banner,
    Button,
    ChipInput,
    Disc,
    GhostRow,
    Icon,
    List,
    ListItem,
    Stepper,
    TextInput,
    Toggle,
  ],
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePage {
  /** Where the brand and "Back to Saturdaze" lead: the marketing site (ADR-018). */
  protected readonly siteUrl = environment.siteUrl;
  private readonly familyService = inject(FAMILY_SERVICE);
  protected readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(Dialog);

  private readonly requestedStep = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('step'))),
    { initialValue: this.route.snapshot.paramMap.get('step') },
  );
  /** The step on screen; an unknown `:step` is sent back to `home`. */
  protected readonly step = computed<WizardStep>(() => {
    const requested = this.requestedStep();
    return isWizardStep(requested) ? requested : 'home';
  });
  protected readonly stepNumber = computed(() => WIZARD_STEPS.indexOf(this.step()) + 1);
  protected readonly stepCount = COUNTED_STEPS;
  protected readonly isFirst = computed(() => this.stepNumber() === 1);

  protected readonly view = this.familyService.getFamily();
  private readonly editable = this.familyService.getEditableProfile();

  protected readonly home = signal('');
  protected readonly canContinueHome = computed(() => this.home().trim().length > 0);
  protected readonly likes = signal<string[]>([]);
  protected readonly dislikes = signal<string[]>([]);
  protected readonly budget = signal(false);
  protected readonly tryNew = signal(false);
  protected readonly fridayPreview = signal(true);

  /** The done step's line: the family, then the verification reminder while unverified (L2-171). */
  protected readonly doneSubtitle = computed(() => {
    const view = this.view();
    const named = view.status === 'ready' && view.headline !== 'Your family';
    const family = named ? `the ${view.headline.replace(/^the\s+/i, '')}` : 'your family';
    const first = `Your first weekend is drafted around ${family}.`;
    const user = this.session.user();
    if (!user || user.emailVerifiedUtc) return first;
    return `${first} We sent a verification link to ${maskEmail(user.email)}. It works for 24 hours.`;
  });

  /** The owner's email while they are not in "Who's in" yet: offers "This is me" (L2-216). */
  private readonly selfEmail = computed(() =>
    this.view().needsSelf ? (this.session.user()?.email ?? null) : null,
  );
  protected readonly addYourselfSubtitle = computed(() => addYourselfSubtitle(this.view().members));

  protected readonly saving = signal(false);
  protected readonly error = signal('');

  private seeded = false;

  constructor() {
    void this.familyService.load();
    // Each step's local state starts from the stored profile, once it has loaded.
    effect(() => {
      const profile = this.editable();
      if (!profile || this.seeded) return;
      this.seeded = true;
      this.seedFrom(profile);
    });
    effect(() => {
      if (!isWizardStep(this.requestedStep())) {
        void this.router.navigate(['/welcome', 'home'], { replaceUrl: true });
      }
    });
  }

  private seedFrom(profile: EditableFamilyProfile): void {
    this.home.set(profile.homeLocation);
    this.likes.set(profile.preferences.filter((p) => p.kind === 'Like').map((p) => p.value));
    this.dislikes.set(profile.preferences.filter((p) => p.kind === 'Dislike').map((p) => p.value));
    this.budget.set(profile.budgetEnabled);
    this.tryNew.set(profile.tryNewEnabled);
    this.fridayPreview.set(profile.fridayPreviewEnabled);
  }

  // ---- navigation -----------------------------------------------------

  protected submit(event?: Event): Promise<void> {
    event?.preventDefault();
    return this.continueStep();
  }

  protected async continueStep(): Promise<void> {
    if (this.saving()) return;
    switch (this.step()) {
      case 'home':
        if (!this.canContinueHome()) return;
        if (!(await this.save((p) => ({ ...p, homeLocation: this.home().trim() })))) return;
        break;
      case 'likes':
        if (
          !(await this.save((p) => ({
            ...p,
            preferences: [
              ...this.likes().map((value) => ({ kind: 'Like' as const, value })),
              ...this.dislikes().map((value) => ({ kind: 'Dislike' as const, value })),
            ],
          })))
        )
          return;
        break;
      case 'preferences':
        if (
          !(await this.save((p) => ({
            ...p,
            budgetEnabled: this.budget(),
            tryNewEnabled: this.tryNew(),
            fridayPreviewEnabled: this.fridayPreview(),
          })))
        )
          return;
        break;
      default:
        break;
    }
    await this.goTo(this.stepNumber() + 1);
  }

  protected skip(): Promise<boolean> {
    return this.goTo(this.stepNumber() + 1);
  }

  protected back(): Promise<boolean> {
    return this.goTo(this.stepNumber() - 1);
  }

  private goTo(number: number): Promise<boolean> {
    const next = WIZARD_STEPS[Math.min(Math.max(number, 1), WIZARD_STEPS.length) - 1];
    return this.router.navigate(['/welcome', next]);
  }

  // ---- who's in (L2-168) ------------------------------------------------

  /** "Add yourself" (L2-217): D17b with "This is me" ticked. */
  protected addYourself(): Promise<void> {
    return this.addMember(true);
  }

  protected async addMember(self = false): Promise<void> {
    const result = await this.openMember({
      mode: 'add',
      existingNames: this.memberNames(),
      selfEmail: this.selfEmail(),
      self,
    });
    if (result?.kind !== 'save') return;
    this.error.set('');
    let invite: FamilyInvite | null;
    try {
      invite = await this.familyService.addMember({
        name: result.name,
        age: result.age,
        email: result.email,
        self: result.self,
      });
    } catch (err) {
      this.error.set(addMemberError(err));
      return;
    }
    if (!invite) return;
    const ref = this.dialog.open<void, InviteLinkDialogData>(InviteLinkDialog, {
      ...DIALOG_OPTIONS,
      data: { name: result.name, email: invite.email, url: invite.url },
    });
    await firstValueFrom(ref.closed);
  }

  protected async editMember(member: MemberRow): Promise<void> {
    const result = await this.openMember({
      mode: 'edit',
      initial: { name: member.name, age: member.age },
      existingNames: this.memberNames(),
      access: member.access,
      email: member.email,
      selfEmail: this.selfEmail(),
      isSelf: member.id === this.view().selfMemberId,
    });
    if (!result) return;
    if (result.kind === 'claim') {
      this.error.set('');
      try {
        await this.familyService.claimMember(member.id);
      } catch (err) {
        this.error.set(addMemberError(err));
      }
      return;
    }
    if (result.kind === 'remove') {
      const ok = await confirmWith(this.dialog, {
        title: `Remove ${member.name} from the family?`,
        body: removalConsequence(member),
        confirmLabel: 'Remove',
        danger: true,
        icon: 'trash',
      });
      if (!ok) return;
      this.error.set('');
      try {
        await this.familyService.removeMember(member.id);
      } catch (err) {
        this.error.set(SAVE_FAILED);
        console.error('WelcomePage remove failed', err);
      }
      return;
    }
    await this.save((p) => ({
      ...p,
      members: p.members.map((m) =>
        m.id === member.id ? { ...m, name: result.name, age: result.age } : m,
      ),
    }));
  }

  private memberNames(): string[] {
    return this.view().members.map((m) => m.name);
  }

  private async openMember(
    data: FamilyMemberDialogData,
  ): Promise<FamilyMemberDialogResult | undefined> {
    const ref = this.dialog.open<FamilyMemberDialogResult, FamilyMemberDialogData>(
      FamilyMemberDialog,
      { ...DIALOG_OPTIONS, data },
    );
    return await firstValueFrom(ref.closed);
  }

  // ---- saving ---------------------------------------------------------

  /** Saves the editable profile with `mutate` applied; `false` when it did not save. */
  private async save(
    mutate: (profile: EditableFamilyProfile) => EditableFamilyProfile,
  ): Promise<boolean> {
    const current = this.editable();
    if (!current) return false;
    this.saving.set(true);
    this.error.set('');
    try {
      await this.familyService.saveProfile(mutate(current));
      return true;
    } catch (err) {
      this.error.set(SAVE_FAILED);
      console.error('WelcomePage save failed', err);
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
