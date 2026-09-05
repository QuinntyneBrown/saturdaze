import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Injector, Type, inject } from '@angular/core';
import { EMPTY } from 'rxjs';

import { Menu, MenuItem, PageHeader, SD_DIALOG_STATIC } from 'components';

import { AddErrandDialog } from '../../dialogs/add-errand-dialog/add-errand-dialog';
import { ApproveSubmissionDialog } from '../../dialogs/approve-submission-dialog/approve-submission-dialog';
import { BlockDialog } from '../../dialogs/block-dialog/block-dialog';
import { CalendarDialog } from '../../dialogs/calendar-dialog/calendar-dialog';
import { CommitmentDialog } from '../../dialogs/commitment-dialog/commitment-dialog';
import { ConfirmDialog } from '../../dialogs/confirm-dialog/confirm-dialog';
import { ErrandAddedDialog } from '../../dialogs/errand-added-dialog/errand-added-dialog';
import { EventSubmittedDialog } from '../../dialogs/event-submitted-dialog/event-submitted-dialog';
import { FamilyMemberDialog } from '../../dialogs/family-member-dialog/family-member-dialog';
import { HomeLocationDialog } from '../../dialogs/home-location-dialog/home-location-dialog';
import { LikesDialog } from '../../dialogs/likes-dialog/likes-dialog';
import { LockRestaurantDialog } from '../../dialogs/lock-restaurant-dialog/lock-restaurant-dialog';
import { MenuDialog } from '../../dialogs/menu-dialog/menu-dialog';
import { RatingDialog } from '../../dialogs/rating-dialog/rating-dialog';
import { RejectSubmissionDialog } from '../../dialogs/reject-submission-dialog/reject-submission-dialog';
import { RenameWeekendDialog } from '../../dialogs/rename-weekend-dialog/rename-weekend-dialog';
import { ShareDialog } from '../../dialogs/share-dialog/share-dialog';
import { SubmitEventDialog } from '../../dialogs/submit-event-dialog/submit-event-dialog';
import * as FIX from './dialog-fixtures';

interface DialogSpecimen {
  readonly kind: 'dialog';
  readonly slug: string;
  readonly label: string;
  readonly component: Type<unknown>;
  readonly data?: unknown;
}

interface MenuSpecimen {
  readonly kind: 'menu';
  readonly slug: string;
  readonly label: string;
  readonly menu: { readonly label: string; readonly header?: string; readonly items: readonly MenuItem[] };
}

type Specimen = DialogSpecimen | MenuSpecimen;

const SPECIMENS: readonly Specimen[] = [
  { kind: 'dialog', slug: 'block', label: 'D1 · Block details', component: BlockDialog, data: { block: FIX.BLOCK } },
  { kind: 'dialog', slug: 'block-locked', label: 'D1 · Block details · locked variant', component: BlockDialog, data: { block: FIX.BLOCK_LOCKED } },
  { kind: 'dialog', slug: 'block-commitment', label: 'D1 · Block details · commitment variant', component: BlockDialog, data: { block: FIX.BLOCK_COMMITMENT } },
  { kind: 'dialog', slug: 'regenerate', label: 'D3 · Regenerate the weekend', component: ConfirmDialog, data: FIX.REGENERATE },
  { kind: 'dialog', slug: 'regenerate-day', label: 'D4 · Regenerate one day', component: ConfirmDialog, data: FIX.REGENERATE_DAY },
  { kind: 'dialog', slug: 'share', label: 'D5 · Share', component: ShareDialog, data: { shareUrl: 'saturdaze.app/s/may17-browns' } },
  { kind: 'dialog', slug: 'calendar', label: 'D6 · Add to calendar', component: CalendarDialog, data: { calendar: { icsUrl: '#', fileName: 'weekend-17-may.ics', eventCount: 10 } } },
  { kind: 'dialog', slug: 'errand', label: 'D7 · Add an errand', component: AddErrandDialog },
  { kind: 'dialog', slug: 'errand-added', label: 'D9 · Errand added', component: ErrandAddedDialog, data: { placement: { description: 'Costco run', day: 'Sunday', time: '9:15', endTime: '10:00', blockId: 'b-costco' } } },
  { kind: 'dialog', slug: 'suggest', label: 'D10 · Suggest an event', component: SubmitEventDialog },
  { kind: 'dialog', slug: 'submitted', label: 'D11 · Submitted', component: EventSubmittedDialog, data: { submission: FIX.SUBMISSION } },
  { kind: 'dialog', slug: 'lock-in', label: 'D12 · Lock it in', component: LockRestaurantDialog, data: { card: FIX.FOOD_CARD, day: 'Saturday', slot: 'Lunch' } },
  { kind: 'dialog', slug: 'rate', label: 'D13 · Rate a weekend', component: RatingDialog, data: { eyebrow: '10 – 11 May · Bronte Creek + Rec Room', rating: 5 } },
  { kind: 'dialog', slug: 'rename', label: 'D14 · Rename', component: RenameWeekendDialog, data: { eyebrow: '10 – 11 May 2026', title: 'Bronte Creek + Rec Room' } },
  { kind: 'dialog', slug: 'repeat', label: 'D15 · Repeat', component: ConfirmDialog, data: FIX.REPEAT },
  { kind: 'dialog', slug: 'remix', label: 'D16 · Remix', component: ConfirmDialog, data: FIX.REMIX },
  { kind: 'dialog', slug: 'member', label: 'D17 · Edit a family member', component: FamilyMemberDialog, data: { mode: 'edit', initial: { name: 'Mae', age: 5 }, existingNames: FIX.MEMBER_NAMES } },
  { kind: 'dialog', slug: 'member-add', label: 'D17 · Add a family member', component: FamilyMemberDialog, data: { mode: 'add', existingNames: FIX.MEMBER_NAMES } },
  { kind: 'dialog', slug: 'commitment', label: 'D18 · Edit a commitment', component: CommitmentDialog, data: { mode: 'edit', initial: { title: 'Swim lessons', day: 'Saturday', startTime: '09:00', endTime: '10:00' }, siblings: [] } },
  { kind: 'dialog', slug: 'commitment-add', label: 'D18 · Add a commitment', component: CommitmentDialog, data: { mode: 'add', siblings: [] } },
  { kind: 'dialog', slug: 'home', label: 'D19 · Home location', component: HomeLocationDialog, data: { location: 'Port Credit, Mississauga' } },
  { kind: 'dialog', slug: 'likes', label: 'D20 · Likes and dislikes', component: LikesDialog, data: { likes: FIX.LIKES, dislikes: FIX.DISLIKES } },
  { kind: 'dialog', slug: 'remove', label: 'D21 · Remove confirm · member', component: ConfirmDialog, data: FIX.REMOVE_MEMBER },
  { kind: 'dialog', slug: 'remove-commitment', label: 'D21 · Remove confirm · commitment', component: ConfirmDialog, data: FIX.REMOVE_COMMITMENT },
  { kind: 'dialog', slug: 'signout', label: 'D22 · Sign out', component: ConfirmDialog, data: FIX.SIGN_OUT },
  { kind: 'dialog', slug: 'approve', label: 'D23 · Approve a submission', component: ApproveSubmissionDialog, data: { card: FIX.SUBMISSION_CARD } },
  { kind: 'dialog', slug: 'reject', label: 'D24 · Reject a submission', component: RejectSubmissionDialog, data: { card: FIX.SUBMISSION_CARD } },
  { kind: 'dialog', slug: 'more', label: 'D25 · Weekend "More" · sheet under 720px, anchored menu above', component: MenuDialog, data: { title: 'Weekend options', items: FIX.MORE_ITEMS } },
  { kind: 'menu', slug: 'more-menu', label: 'D25 · The same options as an anchored menu (720px and up)', menu: { label: 'Weekend options', items: FIX.MORE_ITEMS } },
  { kind: 'menu', slug: 'account', label: 'D26 · Account menu (720px and up; on phones the Family tab covers this)', menu: { label: 'Account', header: 'quinntynebrown@gmail.com', items: FIX.ACCOUNT_ITEMS } },
];

/** A DialogRef that swallows `close()` so inline specimens stay put. */
const NOOP_DIALOG_REF = {
  close: () => undefined,
  closed: EMPTY,
  backdropClick: EMPTY,
  keydownEvents: EMPTY,
  outsidePointerEvents: EMPTY,
  disableClose: true,
  updatePosition: () => NOOP_DIALOG_REF,
  updateSize: () => NOOP_DIALOG_REF,
  addPanelClass: () => NOOP_DIALOG_REF,
  removePanelClass: () => NOOP_DIALOG_REF,
} as unknown as DialogRef;

/**
 * Dialogs gallery — `docs/mocks-v2/pages/dialogs.html` (dev only). Every
 * dialog component rendered inline and static, in the mock's order and
 * with the mock's `#dialog-<slug>` ids, so the visual baselines apply.
 */
@Component({
  selector: 'app-dialogs',
  standalone: true,
  imports: [NgComponentOutlet, Menu, PageHeader],
  templateUrl: './dialogs.page.html',
  styleUrl: './dialogs.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogsPage {
  private readonly injector = inject(Injector);

  protected readonly specimens = SPECIMENS.map((s) => ({
    ...s,
    injector: s.kind === 'dialog' ? this.injectorFor(s.data) : null,
  }));

  private injectorFor(data: unknown): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: DIALOG_DATA, useValue: data ?? {} },
        { provide: DialogRef, useValue: NOOP_DIALOG_REF },
        { provide: SD_DIALOG_STATIC, useValue: true },
      ],
    });
  }
}
