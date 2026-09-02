import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  EditableCommitment,
  EditableFamilyMember,
  EditableFamilyProfile,
  FAMILY_SERVICE,
  PreferenceKey,
  SESSION_STORE,
} from 'api';
import {
  Avatar,
  BottomNav,
  Button,
  Card,
  Chip,
  Icon,
  ListItem,
  Section,
  TagGroup,
  Toggle,
  TopBar,
} from 'components';

import {
  CommitmentDialog,
  CommitmentDialogData,
  CommitmentDialogResult,
} from '../../dialogs/commitment-dialog/commitment-dialog';
import { confirmWith } from '../../dialogs/confirm-dialog/confirm-dialog';
import {
  FamilyMemberDialog,
  FamilyMemberDialogData,
  FamilyMemberDialogResult,
} from '../../dialogs/family-member-dialog/family-member-dialog';
import {
  SignOutDialog,
  SignOutDialogData,
  SignOutDialogResult,
} from '../../dialogs/sign-out-dialog/sign-out-dialog';
import {
  commitmentIcon,
  commitmentSubtitle,
  memberSubtitle,
  memberTone,
} from '../../shared/family-presentation';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    Avatar,
    BottomNav,
    Button,
    Card,
    Chip,
    FormsModule,
    Icon,
    ListItem,
    RouterLink,
    Section,
    TagGroup,
    Toggle,
    TopBar,
  ],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly family = inject(FAMILY_SERVICE);
  private readonly dialog = inject(Dialog);
  private readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);

  protected readonly profile = this.family.getProfile();
  protected readonly editable = this.family.getEditableProfile();
  protected readonly user = this.session.user;
  protected readonly memberError = signal('');
  protected readonly commitmentError = signal('');
  protected readonly preferenceError = signal('');
  protected readonly saving = signal(false);

  protected memberSubtitle(member: EditableFamilyMember): string {
    return memberSubtitle(member);
  }

  protected memberTone(index: number) {
    return memberTone(index);
  }

  protected commitmentSubtitle(commitment: EditableCommitment): string {
    return commitmentSubtitle(commitment);
  }

  protected commitmentIcon(commitment: EditableCommitment): string {
    return commitmentIcon(commitment.title);
  }

  protected openAddMember(): void {
    void this.openMemberDialog({ mode: 'add', existingNames: this.memberNames() });
  }

  protected openEditMember(index: number, member: EditableFamilyMember): void {
    void this.openMemberDialog(
      {
        mode: 'edit',
        initial: { name: member.name, age: member.age },
        existingNames: this.memberNames(),
      },
      index,
    );
  }

  protected async deleteMember(index: number, member: EditableFamilyMember): Promise<void> {
    const current = this.editable();
    if (!current || this.saving()) return;
    const confirmed = await confirmWith(this.dialog, {
      title: `Delete ${member.name}?`,
      body: "I'll stop planning around their age and likes. Saved weekends are untouched.",
      confirmLabel: 'Delete',
      danger: true,
      icon: 'trash',
    });
    if (!confirmed) return;

    this.memberError.set('');
    try {
      await this.saveEditable({
        ...current,
        members: current.members.filter((_, i) => i !== index),
      });
    } catch {
      this.memberError.set('Could not delete the family member.');
    }
  }

  protected openAddCommitment(): void {
    const current = this.editable();
    void this.openCommitmentDialog({
      mode: 'add',
      siblings: current?.commitments ?? [],
    });
  }

  protected openEditCommitment(index: number, commitment: EditableCommitment): void {
    const current = this.editable();
    const siblings = current?.commitments.filter((_, i) => i !== index) ?? [];
    void this.openCommitmentDialog(
      { mode: 'edit', initial: commitment, siblings },
      index,
    );
  }

  protected async deleteCommitment(index: number, commitment: EditableCommitment): Promise<void> {
    const current = this.editable();
    if (!current || this.saving()) return;
    const confirmed = await confirmWith(this.dialog, {
      title: `Delete ${commitment.title}?`,
      body: 'The next plan will no longer be built around it.',
      confirmLabel: 'Delete',
      danger: true,
      icon: 'trash',
    });
    if (!confirmed) return;

    this.commitmentError.set('');
    try {
      await this.saveEditable({
        ...current,
        commitments: current.commitments.filter((_, i) => i !== index),
      });
    } catch {
      this.commitmentError.set('Could not delete the commitment.');
    }
  }

  /** The three toggles persist through the same `PUT /api/family` as everything else. */
  protected async setPreference(key: PreferenceKey, enabled: boolean): Promise<void> {
    const current = this.editable();
    if (!current) return;
    const next: EditableFamilyProfile = {
      ...current,
      budgetEnabled: key === 'budget' ? enabled : current.budgetEnabled,
      tryNewEnabled: key === 'tryNew' ? enabled : current.tryNewEnabled,
      fridayPreviewEnabled: key === 'fridayPreview' ? enabled : current.fridayPreviewEnabled,
    };
    this.preferenceError.set('');
    try {
      await this.saveEditable(next);
    } catch {
      this.preferenceError.set('Could not save that preference.');
    }
  }

  private memberNames(): readonly string[] {
    return this.editable()?.members.map((m) => m.name) ?? [];
  }

  private async openMemberDialog(
    data: FamilyMemberDialogData,
    editIndex: number | null = null,
  ): Promise<void> {
    const ref = this.dialog.open<FamilyMemberDialogResult, FamilyMemberDialogData>(
      FamilyMemberDialog,
      { data, autoFocus: 'first-tabbable', restoreFocus: true },
    );
    const result = await firstValueFrom(ref.closed);
    if (!result) return;

    const current = this.editable();
    if (!current) return;

    this.memberError.set('');
    const members = current.members.map((m) => ({ ...m }));
    if (data.mode === 'add' || editIndex === null) {
      members.push(result);
    } else {
      // Keep the persisted id so a rename updates the row instead of recreating it.
      members[editIndex] = { ...members[editIndex], ...result };
    }

    try {
      await this.saveEditable({ ...current, members });
    } catch {
      this.memberError.set('Could not save the family member.');
    }
  }

  private async openCommitmentDialog(
    data: CommitmentDialogData,
    editIndex: number | null = null,
  ): Promise<void> {
    const ref = this.dialog.open<CommitmentDialogResult, CommitmentDialogData>(
      CommitmentDialog,
      { data, autoFocus: 'first-tabbable', restoreFocus: true },
    );
    const result = await firstValueFrom(ref.closed);
    if (!result) return;

    const current = this.editable();
    if (!current) return;

    this.commitmentError.set('');
    const commitments = current.commitments.map((c) => ({ ...c }));
    if (data.mode === 'add' || editIndex === null) {
      commitments.push(result);
    } else {
      commitments[editIndex] = { ...commitments[editIndex], ...result };
    }

    try {
      await this.saveEditable({ ...current, commitments });
    } catch {
      this.commitmentError.set('Could not save the commitment.');
    }
  }

  private async saveEditable(profile: EditableFamilyProfile): Promise<void> {
    this.saving.set(true);
    try {
      await this.family.saveProfile(profile);
    } finally {
      this.saving.set(false);
    }
  }

  protected async signOut(): Promise<void> {
    const email = this.user()?.email ?? '';
    const ref = this.dialog.open<SignOutDialogResult, SignOutDialogData>(
      SignOutDialog,
      { data: { email }, autoFocus: 'first-tabbable', restoreFocus: true },
    );
    const result = await firstValueFrom(ref.closed);
    if (result !== 'confirm') return;

    await this.session.logout();
    await this.router.navigateByUrl('/login');
  }
}
