import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  EditableCommitment,
  EditableFamilyMember,
  EditableFamilyProfile,
  FAMILY_SERVICE,
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

const MEMBER_TONES = ['primary', 'leaf', 'sky', 'sun', 'indoor'] as const;

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    Avatar,
    BottomNav,
    Button,
    Card,
    Chip,
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
  protected readonly saving = signal(false);

  protected memberSubtitle(member: EditableFamilyMember): string {
    const role = member.age >= 18 ? 'Parent' : 'Kid';
    return `${role} · ${member.age}`;
  }

  protected memberTone(index: number): (typeof MEMBER_TONES)[number] {
    return MEMBER_TONES[index % MEMBER_TONES.length]!;
  }

  protected commitmentSubtitle(commitment: EditableCommitment): string {
    const day =
      commitment.dayOfWeek === 'Saturday' ? 'Saturdays' :
      commitment.dayOfWeek === 'Sunday' ? 'Sundays' :
      `${commitment.dayOfWeek}s`;
    return `${day} ${commitment.startTime} – ${commitment.endTime}`;
  }

  protected commitmentIcon(commitment: EditableCommitment): string {
    const title = commitment.title.toLowerCase();
    if (title.includes('swim') || title.includes('workout') || title.includes('bike')) return 'bike';
    if (title.includes('church') || title.includes('bed')) return 'bed';
    if (title.includes('lunch') || title.includes('dinner')) return 'fork';
    return 'calendar';
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
    if (!current) return;
    if (!window.confirm(`Delete ${member.name}?`)) return;

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
    if (!current) return;
    if (!window.confirm(`Delete ${commitment.title}?`)) return;

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
      members[editIndex] = result;
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
      commitments[editIndex] = result;
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

    this.session.logout();
    await this.router.navigateByUrl('/login');
  }
}
