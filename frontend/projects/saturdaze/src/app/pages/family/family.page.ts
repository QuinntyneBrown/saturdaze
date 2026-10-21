import { Dialog } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  CALENDAR_SERVICE,
  CalendarSettings,
  CommitmentRow,
  EVENT_SUBMISSIONS_SERVICE,
  EditableFamilyProfile,
  FAMILY_SERVICE,
  FamilyInvite,
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
  CalendarFeedDialog,
  CalendarFeedDialogData,
  CalendarFeedDialogResult,
} from '../../dialogs/calendar-feed-dialog/calendar-feed-dialog';
import {
  ConnectCalendarDialog,
  ConnectCalendarDialogData,
} from '../../dialogs/connect-calendar-dialog/connect-calendar-dialog';
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
import {
  HomeLocationDialog,
  HomeLocationDialogData,
} from '../../dialogs/home-location-dialog/home-location-dialog';
import {
  InviteLinkDialog,
  InviteLinkDialogData,
} from '../../dialogs/invite-link-dialog/invite-link-dialog';
import {
  LikesDialog,
  LikesDialogData,
  LikesDialogResult,
} from '../../dialogs/likes-dialog/likes-dialog';
import {
  ProfilePhotoDialog,
  ProfilePhotoDialogData,
  ProfilePhotoDialogResult,
} from '../../dialogs/profile-photo-dialog/profile-photo-dialog';
import { signOutWith } from '../../shared/sign-out';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "just now" / "4 minutes ago" / "3 hours ago" / "20 October" for the Google row. */
function syncedAgo(at: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  return `${at.getDate()} ${MONTHS[at.getMonth()]}`;
}

function weekendDayOf(day: CommitmentRow['dayOfWeek']): WeekendDay | null {
  return day === 'Saturday' || day === 'Sunday' ? day : null;
}

/** Why adding a member was refused (L2-125 #3, L2-126 #3, #4). */
function addMemberError(err: unknown): string {
  const code = (err as { error?: { code?: string } } | null)?.error?.code;
  switch (code) {
    case 'email_in_use':
      return 'That email already signs in to Saturdaze.';
    case 'already_invited':
      return 'That email already has an invite to this family.';
    case 'member_name_in_use':
      return 'Someone in the family already has that name.';
    default:
      return 'That did not save. Try again in a moment.';
  }
}

/** D21 body for removing a member, by how they sign in (L2-128). */
function removalConsequence(member: MemberRow): string {
  if (member.access === 'Account')
    return `${member.name} will be signed out and will no longer be able to sign in.`;
  if (member.access === 'Invited' && member.email)
    return `The invite sent to ${member.email} will stop working.`;
  return 'Future weekends will not plan for them.';
}

/**
 * Family — `docs/mocks/pages/family.html`: who's in, commitments, home,
 * likes and dislikes, preferences, admin (role-gated) and account. Every
 * edit opens a dialog. Only the owner changes who's in
 * (`family.members.html` / `family.member.html`, L2-124): adding and
 * removing a member call the member endpoints; every other edit saves the
 * whole editable profile.
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
  private readonly calendarService = inject(CALENDAR_SERVICE);
  private readonly document = inject(DOCUMENT);

  protected readonly view = this.familyService.getFamily();
  private readonly editable = this.familyService.getEditableProfile();
  protected readonly error = signal('');

  protected readonly user = this.session.user;
  protected readonly membersSubtitle = computed(() => {
    const view = this.view();
    if (view.isOwner) return 'Ages shape the picks. Tap a person to edit.';
    return `Ages shape the picks. Only ${view.ownerEmail ?? 'the owner'} can change who's in.`;
  });
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

  /** The Calendar section (L2-173, L2-179); null until `GET /api/calendar` answers. */
  protected readonly calendar = signal<CalendarSettings | null>(null);
  protected readonly google = computed(() => this.calendar()?.google ?? null);
  /** Back from Google without a connection (L2-173 AC5). */
  protected readonly calendarDenied = signal(
    inject(ActivatedRoute).snapshot.queryParamMap.get('calendar') === 'denied',
  );
  protected readonly googleSubtitle = computed(() => {
    const google = this.google();
    if (!google) return '';
    const synced = google.lastSyncedUtc ? new Date(google.lastSyncedUtc) : null;
    if (!synced) return `${google.email} · not synced yet`;
    if (google.status === 'needs_reconnect')
      return `${google.email} · last synced ${synced.getDate()} ${MONTHS[synced.getMonth()]}`;
    return `${google.email} · synced ${syncedAgo(synced, new Date())}`;
  });
  protected readonly feedActive = computed(() => this.calendar()?.feed.active ?? false);
  protected readonly feedSubtitle = computed(() => {
    const created = this.calendar()?.feed.createdUtc;
    const d = created ? new Date(created) : null;
    const when = d ? `Created ${d.getDate()} ${MONTHS[d.getMonth()]}. ` : '';
    return `${when}Calendar apps refresh it on their own.`;
  });

  constructor() {
    void this.run(() => this.familyService.load());
    void this.loadCalendar();
    if (this.isAdmin()) void this.submissions.loadPending().catch(() => undefined);
  }

  // ---- members --------------------------------------------------------

  protected async addMember(): Promise<void> {
    const result = await this.openMember({ mode: 'add', existingNames: this.memberNames() });
    if (result?.kind !== 'save') return;
    this.error.set('');
    let invite: FamilyInvite | null;
    try {
      invite = await this.familyService.addMember({
        name: result.name,
        age: result.age,
        email: result.email,
      });
    } catch (err) {
      this.error.set(addMemberError(err));
      return;
    }
    if (!invite) return;
    const { email, url } = invite;
    const ref = this.dialog.open<void, InviteLinkDialogData>(InviteLinkDialog, {
      ...DIALOG_OPTIONS,
      data: { name: result.name, email, url },
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
    });
    if (!result) return;
    if (result.kind === 'remove') {
      const ok = await confirmWith(this.dialog, {
        title: `Remove ${member.name} from the family?`,
        body: removalConsequence(member),
        confirmLabel: 'Remove',
        danger: true,
        icon: 'trash',
      });
      if (!ok) return;
      await this.run(() => this.familyService.removeMember(member.id));
      return;
    }
    await this.save((p) => ({
      ...p,
      members: p.members.map((m) =>
        m.id === member.id ? { ...m, name: result.name, age: result.age } : m,
      ),
    }));
  }

  // ---- commitments ----------------------------------------------------

  protected async addCommitment(): Promise<void> {
    const result = await this.openCommitment({
      mode: 'add',
      siblings: this.commitmentSiblings(null),
    });
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
      await this.save((p) => ({
        ...p,
        commitments: p.commitments.filter((c) => c.id !== commitment.id),
      }));
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

  // ---- calendar (L2-173, L2-179) ----------------------------------------

  /** D31, then Google's consent screen; Google returns to `/family/calendar/google`. */
  protected async connectGoogle(): Promise<void> {
    this.calendarDenied.set(false);
    const ref = this.dialog.open<void, ConnectCalendarDialogData>(ConnectCalendarDialog, {
      ...DIALOG_OPTIONS,
      data: {
        start: async () => {
          const url = await this.calendarService.authorizeGoogle();
          this.document.location.assign(url);
        },
      },
    });
    await firstValueFrom(ref.closed);
  }

  /** D32, then `DELETE /api/calendar/google`; written events stay (L2-174). */
  protected async disconnectGoogle(): Promise<void> {
    const ok = await confirmWith(this.dialog, {
      title: 'Disconnect Google Calendar?',
      body: 'Saturdaze stops writing and reading it. Events already there stay.',
      cancelLabel: 'Keep it',
      confirmLabel: 'Disconnect',
      danger: true,
      icon: 'close',
    });
    if (!ok) return;
    await this.run(async () => {
      await this.calendarService.disconnectGoogle();
      await this.loadCalendar();
    });
  }

  protected setReadCommitments(on: boolean): Promise<void> {
    return this.run(async () => {
      this.calendar.set(await this.calendarService.updateGoogle(on));
    });
  }

  /** Creates (or replaces) the subscription link and shows it once in D33. */
  protected async subscribe(): Promise<void> {
    this.error.set('');
    let webcalUrl: string;
    try {
      webcalUrl = (await this.calendarService.createFeed()).webcalUrl;
    } catch {
      this.error.set('The link was not created. Try again in a moment.');
      return;
    }
    void this.loadCalendar();
    const ref = this.dialog.open<CalendarFeedDialogResult, CalendarFeedDialogData>(
      CalendarFeedDialog,
      { ...DIALOG_OPTIONS, data: { webcalUrl } },
    );
    if ((await firstValueFrom(ref.closed)) === 'stop') await this.stopFeed();
  }

  /** D34, then `DELETE /api/calendar/feed`. */
  protected async stopFeed(): Promise<void> {
    const ok = await confirmWith(this.dialog, {
      title: 'Stop the subscription link?',
      body: 'Calendars subscribed to it stop getting this weekend.',
      cancelLabel: 'Keep it',
      confirmLabel: 'Stop the link',
      danger: true,
      icon: 'close',
    });
    if (!ok) return;
    await this.run(async () => {
      await this.calendarService.stopFeed();
      await this.loadCalendar();
    });
  }

  private async loadCalendar(): Promise<void> {
    try {
      this.calendar.set(await this.calendarService.settings());
    } catch {
      // The section keeps its last state; nothing else on the page depends on it.
    }
  }

  // ---- account --------------------------------------------------------

  protected async changePhoto(): Promise<void> {
    const user = this.user();
    if (!user) return;
    const ref = this.dialog.open<ProfilePhotoDialogResult, ProfilePhotoDialogData>(
      ProfilePhotoDialog,
      { ...DIALOG_OPTIONS, data: { name: user.email, currentUrl: user.avatarUrl } },
    );
    const result = await firstValueFrom(ref.closed);
    if (!result) return;
    this.error.set('');
    try {
      await (result.kind === 'save'
        ? this.session.uploadAvatar(result.file)
        : this.session.removeAvatar());
    } catch (err) {
      const message = (err as { message?: string } | null)?.message;
      this.error.set(message ?? 'That did not save. Try again in a moment.');
    }
  }

  protected signOut(): Promise<boolean> {
    return signOutWith(this.dialog, this.session, this.router);
  }

  // ---- helpers --------------------------------------------------------

  private memberNames(): string[] {
    return this.view().members.map((m) => m.name);
  }

  private commitmentSiblings(
    excludeId: string | null,
  ): { title: string; day: WeekendDay | null }[] {
    return this.view()
      .commitments.filter((c) => c.id !== excludeId)
      .map((c) => ({ title: c.title, day: weekendDayOf(c.dayOfWeek) }));
  }

  private async openMember(
    data: FamilyMemberDialogData,
  ): Promise<FamilyMemberDialogResult | undefined> {
    const ref = this.dialog.open<FamilyMemberDialogResult, FamilyMemberDialogData>(
      FamilyMemberDialog,
      {
        ...DIALOG_OPTIONS,
        data,
      },
    );
    return await firstValueFrom(ref.closed);
  }

  private async openCommitment(
    data: CommitmentDialogData,
  ): Promise<CommitmentDialogResult | undefined> {
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
