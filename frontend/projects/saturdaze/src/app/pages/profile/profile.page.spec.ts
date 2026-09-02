import { vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { Dialog } from '@angular/cdk/dialog';
import { of } from 'rxjs';
import { FAMILY_SERVICE, SESSION_STORE, type EditableFamilyProfile, type FamilyProfile } from 'api';
import { ProfilePage } from './profile.page';

function editable(): EditableFamilyProfile {
  return {
    name: 'The Browns',
    homeLocation: 'Port Credit',
    budgetEnabled: false,
    tryNewEnabled: false,
    fridayPreviewEnabled: true,
    members: [
      { id: 'm1', name: 'Quinn', age: 41 },
      { id: 'm2', name: 'Mae', age: 5 },
    ],
    commitments: [{ id: 'c1', title: 'Swim', dayOfWeek: 'Saturday', startTime: '09:00', endTime: '10:00' }],
    preferences: [{ kind: 'Like', value: 'Hiking' }],
  };
}

const profile: FamilyProfile = {
  familyName: 'The Browns',
  location: 'Port Credit',
  likes: [{ label: 'Hiking', tone: 'leaf', icon: 'heart' }],
  preferences: [
    { key: 'budget', title: 'Budget is a factor', subtitle: 'Off', checked: false },
    { key: 'tryNew', title: 'Try something new each weekend', subtitle: 'Off', checked: false },
    { key: 'fridayPreview', title: 'Friday preview notifications', subtitle: 'On', checked: true },
  ],
};

describe('ProfilePage', () => {
  let component: ProfilePage;
  let fixture: ComponentFixture<ProfilePage>;
  let mockDialog: { open: ReturnType<typeof vi.fn> };
  let family: any;
  let session: any;
  const profileSignal = signal<FamilyProfile>(profile);
  const editableSignal = signal<EditableFamilyProfile | null>(editable());

  beforeEach(async () => {
    editableSignal.set(editable());
    mockDialog = { open: vi.fn(() => ({ closed: of('confirm') })) };
    family = {
      getProfile: () => profileSignal,
      getEditableProfile: () => editableSignal,
      saveProfile: vi.fn(() => Promise.resolve()),
    };
    session = {
      user: signal({ id: 'u1', email: 'q@b.c', role: 'Admin', emailVerifiedUtc: null }),
      logout: vi.fn(() => Promise.resolve()),
    };

    await TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: FAMILY_SERVICE, useValue: family },
        { provide: SESSION_STORE, useValue: session },
        { provide: Dialog, useValue: mockDialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the family, members, commitments, toggles and admin tools', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('The Browns');
    expect(el.querySelectorAll('sd-avatar')).toHaveLength(3);
    expect(el.textContent).toContain('Saturdays 09:00 – 10:00');
    expect(el.querySelectorAll('sd-toggle')).toHaveLength(3);
    expect(el.textContent).toContain('Event moderation');
    expect(el.textContent).not.toContain('Daily rhythm');
  });

  it('deletes a member only after the CDK confirm sheet', async () => {
    await component['deleteMember'](1, editable().members[1]!);
    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockDialog.open.mock.calls[0][1].data).toMatchObject({ title: 'Delete Mae?', danger: true });
    expect(family.saveProfile).toHaveBeenCalledTimes(1);
    expect(family.saveProfile.mock.calls[0][0].members.map((m: any) => m.name)).toEqual(['Quinn']);

    family.saveProfile.mockClear();
    mockDialog.open = vi.fn(() => ({ closed: of(undefined) }));
    await component['deleteMember'](1, editable().members[1]!);
    expect(family.saveProfile).not.toHaveBeenCalled();
  });

  it('deletes a commitment after confirmation and reports failures', async () => {
    await component['deleteCommitment'](0, editable().commitments[0]!);
    expect(family.saveProfile.mock.calls[0][0].commitments).toEqual([]);
    family.saveProfile = vi.fn(() => Promise.reject(new Error('boom')));
    await component['deleteCommitment'](0, editable().commitments[0]!);
    expect(component['commitmentError']()).toBe('Could not delete the commitment.');
  });

  it('keeps the member id when editing', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of({ name: 'Maeve', age: 6 }) }));
    component['openEditMember'](1, editable().members[1]!);
    await fixture.whenStable();
    expect(family.saveProfile.mock.calls[0][0].members[1]).toEqual({ id: 'm2', name: 'Maeve', age: 6 });
  });

  it('adds a commitment from the dialog result', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of({ title: 'Church', dayOfWeek: 'Sunday', startTime: '10:30', endTime: '11:30' }) }));
    component['openAddCommitment']();
    await fixture.whenStable();
    expect(family.saveProfile.mock.calls[0][0].commitments).toHaveLength(2);
  });

  it('persists a preference toggle through saveProfile', async () => {
    await component['setPreference']('tryNew', true);
    expect(family.saveProfile).toHaveBeenCalledWith(expect.objectContaining({ tryNewEnabled: true, budgetEnabled: false, fridayPreviewEnabled: true }));
    family.saveProfile = vi.fn(() => Promise.reject(new Error('boom')));
    await component['setPreference']('budget', true);
    expect(component['preferenceError']()).toBe('Could not save that preference.');
  });

  it('signs out after confirmation and returns to login', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await component['signOut']();
    expect(session.logout).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('stays signed in when the sheet is dismissed', async () => {
    mockDialog.open = vi.fn(() => ({ closed: of(undefined) }));
    await component['signOut']();
    expect(session.logout).not.toHaveBeenCalled();
  });
});
