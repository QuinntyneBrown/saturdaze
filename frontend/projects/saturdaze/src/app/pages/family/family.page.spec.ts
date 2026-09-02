import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import {
  EVENT_SUBMISSIONS_SERVICE,
  EditableFamilyProfile,
  FAMILY_SERVICE,
  FamilyView,
  SESSION_STORE,
  User,
} from 'api';

import { CommitmentDialog } from '../../dialogs/commitment-dialog/commitment-dialog';
import { ConfirmDialog } from '../../dialogs/confirm-dialog/confirm-dialog';
import { FamilyMemberDialog } from '../../dialogs/family-member-dialog/family-member-dialog';
import { HomeLocationDialog } from '../../dialogs/home-location-dialog/home-location-dialog';
import { LikesDialog } from '../../dialogs/likes-dialog/likes-dialog';
import { SUBMISSION } from '../dialogs/dialog-fixtures';
import { FamilyPage } from './family.page';

const VIEW: FamilyView = {
  status: 'ready',
  headline: 'The Browns',
  subtitle: 'Port Credit. Every weekend is planned around this.',
  home: { location: 'Port Credit, Mississauga', hint: 'Weather and drive times start here' },
  members: [
    { id: 'm-quinn', name: 'Quinn', initial: 'Q', tone: 'primary', age: 38, role: 'Parent', subtitle: 'Parent · 38' },
    { id: 'm-mae', name: 'Mae', initial: 'M', tone: 'sun', age: 5, role: 'Kid', subtitle: 'Kid · 5' },
  ],
  commitments: [
    {
      id: 'c-swim',
      title: 'Swim lessons',
      dayOfWeek: 'Saturday',
      dayLabel: 'Saturdays',
      startTime: '09:00',
      endTime: '10:00',
      subtitle: 'Saturdays · 9:00 to 10:00',
      icon: 'bike',
    },
    {
      id: 'c-piano',
      title: 'Piano',
      dayOfWeek: 'Wednesday',
      dayLabel: 'Wednesdays',
      startTime: '16:00',
      endTime: '17:00',
      subtitle: 'Wednesdays · 4:00 to 5:00',
      icon: 'sparkle',
    },
  ],
  likes: [{ tone: 'leaf', icon: 'heart', label: 'Parks' }],
  dislikes: [{ tone: 'warn', icon: 'close', label: 'Camping' }],
  preferences: [
    { key: 'budget', title: 'Keep it cheap', subtitle: 'Free or under $40.', checked: false },
    { key: 'tryNew', title: 'Try something new', subtitle: 'One new place a weekend.', checked: true },
    { key: 'fridayPreview', title: 'Friday preview', subtitle: 'A draft at 6pm.', checked: true },
  ],
  plannedAround: [],
};

const PROFILE: EditableFamilyProfile = {
  name: 'The Browns',
  homeLocation: 'Port Credit, Mississauga',
  budgetEnabled: false,
  tryNewEnabled: true,
  fridayPreviewEnabled: true,
  members: [
    { id: 'm-quinn', name: 'Quinn', age: 38 },
    { id: 'm-mae', name: 'Mae', age: 5 },
  ],
  commitments: [
    { id: 'c-swim', title: 'Swim lessons', dayOfWeek: 'Saturday', startTime: '09:00', endTime: '10:00' },
    { id: 'c-piano', title: 'Piano', dayOfWeek: 'Wednesday', startTime: '16:00', endTime: '17:00' },
  ],
  preferences: [
    { kind: 'Like', value: 'Parks' },
    { kind: 'Dislike', value: 'Camping' },
  ],
};

const USER: User = { id: 'u1', email: 'quinntynebrown@gmail.com', role: 'User', emailVerifiedUtc: '2026-03-02T10:00:00Z' };

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('FamilyPage', () => {
  let fixture: ComponentFixture<FamilyPage>;
  let component: FamilyPage;
  let host: HTMLElement;
  let view: ReturnType<typeof signal<FamilyView>>;
  let editable: ReturnType<typeof signal<EditableFamilyProfile | null>>;
  let familyService: any;
  let submissions: { pending: () => unknown; loadPending: ReturnType<typeof vi.fn> };
  let pending: ReturnType<typeof signal<any[]>>;
  let session: { user: ReturnType<typeof signal<User | null>>; logout: ReturnType<typeof vi.fn> };
  let dialog: { open: ReturnType<typeof vi.fn> };

  async function mount(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [FamilyPage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: FAMILY_SERVICE, useValue: familyService },
        { provide: EVENT_SUBMISSIONS_SERVICE, useValue: submissions },
        { provide: SESSION_STORE, useValue: session },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FamilyPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    view = signal<FamilyView>(VIEW);
    editable = signal<EditableFamilyProfile | null>(PROFILE);
    familyService = {
      getFamily: () => view,
      getEditableProfile: () => editable,
      load: vi.fn(async () => undefined),
      saveProfile: vi.fn(async () => undefined),
    };
    pending = signal<any[]>([]);
    submissions = { pending: () => pending, loadPending: vi.fn(async () => undefined) };
    session = { user: signal<User | null>(USER), logout: vi.fn(async () => undefined) };
    dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
  });

  const saved = (): EditableFamilyProfile => familyService.saveProfile.mock.calls.at(-1)![0];
  const section = (title: string): HTMLElement => host.querySelector(`sd-section[title="${title}"]`) as HTMLElement;
  const confirmData = (): any => dialog.open.mock.calls.find((c) => c[0] === ConfirmDialog)?.[1].data;

  it('loads the family and renders every section from the view', async () => {
    await mount();
    expect(familyService.load).toHaveBeenCalledTimes(1);
    expect(submissions.loadPending).not.toHaveBeenCalled();
    expect(host.querySelector('sd-page-header')?.getAttribute('title')).toBe('The Browns');

    const members = Array.from(section("Who's in").querySelectorAll('sd-list-item'));
    expect(members.map((m) => m.getAttribute('title'))).toEqual(['Quinn', 'Mae']);
    expect(members.map((m) => m.getAttribute('subtitle'))).toEqual(['Parent · 38', 'Kid · 5']);
    expect(members[1]?.querySelector('sd-avatar')?.getAttribute('tone')).toBe('sun');
    expect(section("Who's in").querySelector('sd-ghost-row')?.textContent?.trim()).toBe('Add a family member');

    const commitments = Array.from(section('Locked in every weekend').querySelectorAll('sd-list-item'));
    expect(commitments.map((c) => c.getAttribute('title'))).toEqual(['Swim lessons', 'Piano']);

    expect(section('Home').querySelector('sd-list-item')?.getAttribute('title')).toBe('Port Credit, Mississauga');
    expect(
      Array.from(section('Likes and dislikes').querySelectorAll('sd-chip')).map((c) => c.getAttribute('tone')),
    ).toEqual(['leaf', 'warn']);
    expect(section('Preferences').querySelectorAll('sd-toggle').length).toBe(3);
    expect(section('Admin')).toBeNull();
    expect(section('Account').querySelector('.account-card__title')?.textContent?.trim()).toBe(USER.email);
    expect(section('Account').querySelector('.account-card__sub')?.textContent?.trim()).toBe(
      'Signed in since March 2026',
    );
  });

  it('shows a status row while loading and an unverified hint on the account card', async () => {
    view.set({ ...VIEW, status: 'loading' });
    session.user.set({ ...USER, emailVerifiedUtc: null });
    await mount();
    expect(host.querySelector('sd-status-row')?.textContent?.trim()).toBe('Loading your family.');
    expect(host.querySelector('.family-grid')).toBeNull();
    expect(component['accountSubtitle']()).toBe('Email not verified yet');
  });

  it('adds a member through D17 and saves the whole profile', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of({ kind: 'save', name: 'Eli', age: 9 }) });
    (section("Who's in").querySelector('sd-ghost-row button') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(
      FamilyMemberDialog,
      expect.objectContaining({ data: { mode: 'add', existingNames: ['Quinn', 'Mae'] } }),
    );
    expect(saved().members).toEqual([...PROFILE.members, { name: 'Eli', age: 9 }]);
  });

  it('edits a member, or removes them after D21', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of({ kind: 'save', name: 'Mae', age: 6 }) });
    (section("Who's in").querySelectorAll('sd-list-item button')[1] as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(
      FamilyMemberDialog,
      expect.objectContaining({
        data: { mode: 'edit', initial: { name: 'Mae', age: 5 }, existingNames: ['Quinn', 'Mae'] },
      }),
    );
    expect(saved().members).toEqual([
      { id: 'm-quinn', name: 'Quinn', age: 38 },
      { id: 'm-mae', name: 'Mae', age: 6 },
    ]);

    dialog.open
      .mockReturnValueOnce({ closed: of({ kind: 'remove' }) })
      .mockReturnValueOnce({ closed: of('confirm') });
    await component['editMember'](VIEW.members[1]!);
    expect(confirmData()).toMatchObject({ title: 'Remove Mae from the family?', danger: true, confirmLabel: 'Remove' });
    expect(saved().members).toEqual([{ id: 'm-quinn', name: 'Quinn', age: 38 }]);

    familyService.saveProfile.mockClear();
    dialog.open.mockReturnValueOnce({ closed: of({ kind: 'remove' }) }).mockReturnValueOnce({ closed: of(undefined) });
    await component['editMember'](VIEW.members[1]!);
    expect(familyService.saveProfile).not.toHaveBeenCalled();
  });

  it('adds and edits commitments through D18, passing the siblings for the duplicate check', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({
      closed: of({ kind: 'save', title: 'Church', day: 'Sunday', startTime: '10:30', endTime: '11:45' }),
    });
    await component['addCommitment']();
    expect(dialog.open).toHaveBeenCalledWith(
      CommitmentDialog,
      expect.objectContaining({
        data: {
          mode: 'add',
          siblings: [
            { title: 'Swim lessons', day: 'Saturday' },
            { title: 'Piano', day: null },
          ],
        },
      }),
    );
    expect(saved().commitments.at(-1)).toEqual({
      title: 'Church',
      dayOfWeek: 'Sunday',
      startTime: '10:30',
      endTime: '11:45',
    });

    dialog.open.mockReturnValueOnce({
      closed: of({ kind: 'save', title: 'Piano practice', day: null, startTime: '16:00', endTime: '16:45' }),
    });
    await component['editCommitment'](VIEW.commitments[1]!);
    expect(dialog.open).toHaveBeenLastCalledWith(
      CommitmentDialog,
      expect.objectContaining({
        data: {
          mode: 'edit',
          initial: { title: 'Piano', day: null, startTime: '16:00', endTime: '17:00' },
          siblings: [{ title: 'Swim lessons', day: 'Saturday' }],
        },
      }),
    );
    expect(saved().commitments[1]).toEqual({
      id: 'c-piano',
      title: 'Piano practice',
      dayOfWeek: 'Wednesday',
      startTime: '16:00',
      endTime: '16:45',
    });
  });

  it('removes a commitment after D21', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of({ kind: 'remove' }) }).mockReturnValueOnce({ closed: of('confirm') });
    (section('Locked in every weekend').querySelectorAll('sd-list-item button')[0] as HTMLButtonElement).click();
    await settle();
    expect(confirmData()).toMatchObject({ title: 'Remove Swim lessons?', danger: true });
    expect(saved().commitments.map((c) => c.id)).toEqual(['c-piano']);
  });

  it('edits the home location and the likes through their dialogs', async () => {
    await mount();
    dialog.open.mockReturnValueOnce({ closed: of('Lorne Park') });
    (section('Home').querySelector('sd-button[slot="action"] button') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenCalledWith(
      HomeLocationDialog,
      expect.objectContaining({ data: { location: 'Port Credit, Mississauga' } }),
    );
    expect(saved().homeLocation).toBe('Lorne Park');

    dialog.open.mockReturnValueOnce({ closed: of({ likes: ['Parks', 'Zoo'], dislikes: [] }) });
    (section('Likes and dislikes').querySelector('sd-button[slot="action"] button') as HTMLButtonElement).click();
    await settle();
    expect(dialog.open).toHaveBeenLastCalledWith(
      LikesDialog,
      expect.objectContaining({ data: { likes: ['Parks'], dislikes: ['Camping'] } }),
    );
    expect(saved().preferences).toEqual([
      { kind: 'Like', value: 'Parks' },
      { kind: 'Like', value: 'Zoo' },
    ]);
  });

  it('flips one preference at a time', async () => {
    await mount();
    await component['setPreference']('budget', true);
    expect(saved()).toMatchObject({ budgetEnabled: true, tryNewEnabled: true, fridayPreviewEnabled: true });
    await component['setPreference']('fridayPreview', false);
    expect(saved()).toMatchObject({ budgetEnabled: false, tryNewEnabled: true, fridayPreviewEnabled: false });
  });

  it('does not save before the editable profile has loaded', async () => {
    editable.set(null);
    await mount();
    await component['setPreference']('budget', true);
    expect(familyService.saveProfile).not.toHaveBeenCalled();
  });

  it('shows the admin card linking to the review queue for admins only', async () => {
    session.user.set({ ...USER, role: 'Admin' });
    await mount();
    expect(submissions.loadPending).toHaveBeenCalledTimes(1);
    const row = section('Admin').querySelector('sd-list-item');
    expect(row?.getAttribute('href')).toBe('/review-submissions');
    expect(row?.getAttribute('title')).toBe('Review submissions');
    expect(row?.getAttribute('subtitle')).toBe('Nothing waiting');
    expect(section('Admin').querySelector('sd-chip[slot="trailing"]')).toBeNull();
  });

  // SOURCE BUG (family.page.ts `pendingCount`): it reads
  // `this.submissions.pending().length` — the `.length` of the Signal function
  // (its arity, 0) rather than of the array it holds — so the admin card always
  // says "Nothing waiting" and never shows the count chip. Un-skip once it
  // reads `pending()().length`.
  it('counts the pending submissions on the admin card', async () => {
    session.user.set({ ...USER, role: 'Admin' });
    pending.set([SUBMISSION, { ...SUBMISSION, id: 's-2' }]);
    await mount();
    const row = section('Admin').querySelector('sd-list-item');
    expect(row?.getAttribute('subtitle')).toBe('2 waiting');
    expect(row?.querySelector('sd-chip[slot="trailing"]')?.textContent?.trim()).toBe('2');

    pending.set([SUBMISSION]);
    fixture.detectChanges();
    expect(section('Admin').querySelector('sd-list-item')?.getAttribute('subtitle')).toBe('1 waiting');
  });

  it('signs out through D22 from the account card', async () => {
    await mount();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    dialog.open.mockReturnValueOnce({ closed: of('confirm') });
    (section('Account').querySelector('sd-button button') as HTMLButtonElement).click();
    await settle();
    expect(confirmData()).toMatchObject({ title: 'Sign out?', confirmLabel: 'Sign out', danger: true });
    expect(session.logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/sign-in');
  });

  it('shows a warn banner when a save fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await mount();
    familyService.saveProfile.mockRejectedValueOnce(new Error('500'));
    await component['setPreference']('budget', true);
    fixture.detectChanges();
    expect(host.querySelector('sd-banner.error')?.textContent?.trim()).toBe('That did not save. Try again in a moment.');
    consoleError.mockRestore();
  });
});
