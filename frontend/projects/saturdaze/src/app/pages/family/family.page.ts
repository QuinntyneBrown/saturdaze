import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  CommitmentRow,
  EVENT_SUBMISSIONS_SERVICE,
  EditableFamilyProfile,
  FAMILY_SERVICE,
  MemberRow,
  PreferenceKey,
  SESSION_STORE,
  WeekendDay,
} from 'api';
import {
  Avatar,
  Banner,
  Button,
  Card,
  Chip,
  Disc,
  GhostRow,
  Icon,
  List,
  ListItem,
  PageHeader,
  Section,
  StatusRow,
  Toggle,
} from 'components';

import {
  CommitmentDialog,
  CommitmentDialogData,
  CommitmentDialogResult,
} from '../../dialogs/commitment-dialog/commitment-dialog';
import { DIALOG_OPTIONS, confirmWith } from '../../dialogs/confirm-dialog/confirm-dialog';
import {
  FamilyMemberDialog,
  FamilyMemberDialogData,
  FamilyMemberDialogResult,
} from '../../dialogs/family-member-dialog/family-member-dialog';
import { HomeLocationDialog, HomeLocationDialogData } from '../../dialogs/home-location-dialog/home-location-dialog';
import { LikesDialog, LikesDialogData, LikesDialogResult } from '../../dialogs/likes-dialog/likes-dialog';
import { signOutWith } from '../../shared/sign-out';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function weekendDayOf(day: CommitmentRow['dayOfWeek']): WeekendDay | null {
  return day === 'Saturday' || day === 'Sunday' ? day : null;
}

/**
 * Family — `docs/mocks-v2/pages/family.html`: who's in, commitments, home,
 * likes and dislikes, preferences, admin (role-gated) and account. Every
 * edit opens a dialog and saves the whole editable profile.
 */
@Component({
  selector: 'app-family',
  standalone: true,
  imports: [
    FormsModule,
    Avatar,
    Banner,
    Button,
    Card,
    Chip,
    Disc,
    GhostRow,
    Icon,
    List,
    ListItem,
    PageHeader,
    Section,
    StatusRow,
    Toggle,
  ],
  templateUrl: './family.page.html',
  styleUrl: './family.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamilyPage {
  private readonly familyService = inject(FAMILY_SERVICE);
  private readonly submissions = inject(EVENT_SUBMISSIONS_SERVICE);
  private readonly session = inject(SESSION_STORE);
  private readonly dialog = inject(Dialog);
  private readonly router = inject(Router);

  protected readonly view = this.familyService.getFamily();
  private readonly editable = this.familyService.getEditableProfile();
  protected readonly error = signal('');

  protected readonly user = this.session.user;
  protected readonly isAdmin = computed(() => this.user()?.role === 'Admin');
  protected readonly pendingCount = computed(() => this.submissions.pending()().length);
  protected readonly pendingSubtitle = computed(() => {
    const n = this.pendingCount();
    return n === 0 ? 'Nothing waiting' : n === 1 ? '1 waiting' : `${n} waiting`;
  });
  protected readonly accountSubtitle = computed(() => {
    const verified = this.user()?.emailVerifiedUtc;
    if (!verified) return 'Email not verified yet';
    const d = new Date(verified);
    return `Signed in since ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  });

  constructor() {
    void this.run(() => this.familyService.load());
    if (this.isAdmin()) void this.submissions.loadPending().catch(() => undefined);
  }

  // ---- members --------------------------------------------------------

  protected async addMember(): Promise<void> {
    const result = await this.openMember({ mode: 'add', existingNames: this.memberNames() });
    if (result?.kind !== 'save') return;
    await this.save((p) => ({ ...p, members: [...p.members, { name: result.name, age: result.age }] }));
  }

  protected async editMember(member: MemberRow): Promise<void> {
    const result = await this.openMember({
      mode: 'edit',
      initial: { name: member.name, age: member.age },
      existingNames: this.memberNames(),
    });
    if (!result) return;
    if (result.kind === 'remove') {
      const ok = await confirmWith(this.dialog, {
        title: `Remove ${member.name} from the family?`,
        body: 'Future weekends will not plan for them.',
        confirmLabel: 'Remove',
        danger: true,
        icon: 'trash',
      });
      if (!ok) return;
      await this.save((p) => ({ ...p, members: p.members.filter((m) => m.id !== member.id) }));
      return;
    }
    await this.save((p) => ({
      ...p,
      members: p.members.map((m) => (m.id === member.id ? { ...m, name: result.name, age: result.age } : m)),
    }));
  }

  // ---- commitments ----------------------------------------------------

  protected async addCommitment(): Promise<void> {
    const result = await this.openCommitment({ mode: 'add', siblings: this.commitmentSiblings(null) });
    if (result?.kind !== 'save') return;
    await this.save((p) => ({
      ...p,
      commitments: [
        ...p.commitments,
        {
          title: result.title,
          dayOfWeek: result.day ?? 'Saturday',
          startTime: result.startTime,
          endTime: result.endTime,
        },
      ],
    }));
  }

  protected async editCommitment(commitment: CommitmentRow): Promise<void> {
    const result = await this.openCommitment({
      mode: 'edit',
      initial: {
        title: commitment.title,
        day: weekendDayOf(commitment.dayOfWeek),
        startTime: commitment.startTime,
        endTime: commitment.endTime,
      },
      siblings: this.commitmentSiblings(commitment.id),
    });
    if (!result) return;
    if (result.kind === 'remove') {
      const ok = await confirmWith(this.dialog, {
        title: `Remove ${commitment.title}?`,
        body: 'Weekends stop planning around it.',
        confirmLabel: 'Remove',
        danger: true,
        icon: 'trash',
      });
      if (!ok) return;
      await this.save((p) => ({ ...p, commitments: p.commitments.filter((c) => c.id !== commitment.id) }));
      return;
    }
    await this.save((p) => ({
      ...p,
      commitments: p.commitments.map((c) =>
        c.id === commitment.id
          ? {
              ...c,
              title: result.title,
              dayOfWeek: result.day ?? c.dayOfWeek,
              startTime: result.startTime,
              endTime: result.endTime,
            }
          : c,
      ),
    }));
  }

  // ---- home, likes, preferences ---------------------------------------

  protected async editHome(): Promise<void> {
    const ref = this.dialog.open<string, HomeLocationDialogData>(HomeLocationDialog, {
      ...DIALOG_OPTIONS,
      data: { location: this.view().home.location },
    });
    const location = await firstValueFrom(ref.closed);
    if (!location) return;
    await this.save((p) => ({ ...p, homeLocation: location }));
  }

  protected async editLikes(): Promise<void> {
    const ref = this.dialog.open<LikesDialogResult, LikesDialogData>(LikesDialog, {
      ...DIALOG_OPTIONS,
      data: {
        likes: this.view().likes.map((c) => c.label),
        dislikes: this.view().dislikes.map((c) => c.label),
      },
    });
    const result = await firstValueFrom(ref.closed);
    if (!result) return;
    await this.save((p) => ({
      ...p,
      preferences: [
        ...result.likes.map((value) => ({ kind: 'Like' as const, value })),
        ...result.dislikes.map((value) => ({ kind: 'Dislike' as const, value })),
      ],
    }));
  }

  protected setPreference(key: PreferenceKey, checked: boolean): Promise<void> {
    return this.save((p) => ({
      ...p,
      budgetEnabled: key === 'budget' ? checked : p.budgetEnabled,
      tryNewEnabled: key === 'tryNew' ? checked : p.tryNewEnabled,
      fridayPreviewEnabled: key === 'fridayPreview' ? checked : p.fridayPreviewEnabled,
    }));
  }

  // ---- account --------------------------------------------------------

  protected signOut(): Promise<boolean> {
    return signOutWith(this.dialog, this.session, this.router);
  }

  // ---- helpers --------------------------------------------------------

  private memberNames(): string[] {
    return this.view().members.map((m) => m.name);
  }

  private commitmentSiblings(excludeId: string | null): { title: string; day: WeekendDay | null }[] {
    return this.view()
      .commitments.filter((c) => c.id !== excludeId)
      .map((c) => ({ title: c.title, day: weekendDayOf(c.dayOfWeek) }));
  }

  private async openMember(data: FamilyMemberDialogData): Promise<FamilyMemberDialogResult | undefined> {
    const ref = this.dialog.open<FamilyMemberDialogResult, FamilyMemberDialogData>(FamilyMemberDialog, {
      ...DIALOG_OPTIONS,
      data,
    });
    return await firstValueFrom(ref.closed);
  }

  private async openCommitment(data: CommitmentDialogData): Promise<CommitmentDialogResult | undefined> {
    const ref = this.dialog.open<CommitmentDialogResult, CommitmentDialogData>(CommitmentDialog, {
      ...DIALOG_OPTIONS,
      data,
    });
    return await firstValueFrom(ref.closed);
  }

  private save(mutate: (profile: EditableFamilyProfile) => EditableFamilyProfile): Promise<void> {
    return this.run(async () => {
      const current = this.editable();
      if (!current) return;
      await this.familyService.saveProfile(mutate(current));
    });
  }

  private async run(work: () => Promise<void>): Promise<void> {
    this.error.set('');
    try {
      await work();
    } catch (err) {
      this.error.set('That did not save. Try again in a moment.');
      console.error('FamilyPage action failed', err);
    }
  }
}
