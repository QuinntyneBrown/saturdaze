import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dialog } from '@angular/cdk/dialog';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, map, of } from 'rxjs';

import { EditableFamilyProfile, FAMILY_SERVICE, FamilyView, SESSION_STORE, User } from 'api';

import { ConfirmDialog } from '../../dialogs/confirm-dialog/confirm-dialog';
import { FamilyMemberDialog } from '../../dialogs/family-member-dialog/family-member-dialog';
import { InviteLinkDialog } from '../../dialogs/invite-link-dialog/invite-link-dialog';
import { WelcomePage } from './welcome.page';

const MAE = {
  id: 'm-mae',
  name: 'Mae',
  initial: 'M',
  tone: 'sun' as const,
  age: 5,
  role: 'Kid' as const,
  access: 'None' as const,
  email: null,
  subtitle: 'Kid · 5',
};

const VIEW: FamilyView = {
  status: 'ready',
  headline: 'The Browns',
  subtitle: 'Every weekend is planned around this.',
  home: { location: '', hint: 'Weather and drive times start here' },
  isOwner: true,
  ownerEmail: 'quinntynebrown@gmail.com',
  members: [],
  commitments: [],
  likes: [],
  dislikes: [],
  preferences: [
    { key: 'budget', title: 'Budget matters', subtitle: 'Prefer free picks', checked: false },
    { key: 'tryNew', title: 'Try something new each weekend', subtitle: 'One', checked: false },
    { key: 'fridayPreview', title: 'Friday preview email', subtitle: 'A draft', checked: true },
  ],
  plannedAround: [],
};

const PROFILE: EditableFamilyProfile = {
  name: 'The Browns',
  homeLocation: '',
  budgetEnabled: false,
  tryNewEnabled: false,
  fridayPreviewEnabled: true,
  members: [],
  commitments: [],
  preferences: [],
};

const USER: User = {
  id: 'u1',
  email: 'quinntynebrown@gmail.com',
  role: 'User',
  emailVerifiedUtc: null,
  avatarUrl: null,
};

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('WelcomePage', () => {
  let fixture: ComponentFixture<WelcomePage>;
  let component: WelcomePage;
  let host: HTMLElement;
  let view: ReturnType<typeof signal<FamilyView>>;
  let editable: ReturnType<typeof signal<EditableFamilyProfile | null>>;
  let familyService: any;
  let session: { user: ReturnType<typeof signal<User | null>> };
  let dialog: { open: ReturnType<typeof vi.fn> };
  let params: BehaviorSubject<string | null>;
  let navigate: ReturnType<typeof vi.spyOn>;

  async function mount(step: string | null = 'home'): Promise<void> {
    params = new BehaviorSubject<string | null>(step);
    const paramMap = params.pipe(map((s) => convertToParamMap(s === null ? {} : { step: s })));
    await TestBed.configureTestingModule({
      imports: [WelcomePage],
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap,
            snapshot: { paramMap: convertToParamMap(step === null ? {} : { step }) },
          },
        },
        { provide: FAMILY_SERVICE, useValue: familyService },
        { provide: SESSION_STORE, useValue: session },
        { provide: Dialog, useValue: dialog },
      ],
    }).compileComponents();
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(WelcomePage);
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
      addMember: vi.fn(async () => null),
      removeMember: vi.fn(async () => undefined),
    };
    session = { user: signal<User | null>(USER) };
    dialog = { open: vi.fn(() => ({ closed: of(undefined) })) };
  });

  const title = (): string | undefined =>
    host.querySelector('.auth-card__title')?.textContent?.trim();
  const stepperLabel = (): string | undefined =>
    host.querySelector('.stepper__label')?.textContent?.trim();
  const continueButton = (): HTMLButtonElement =>
    host.querySelector('button[type="submit"]') as HTMLButtonElement;
  const buttonNamed = (name: string): HTMLButtonElement | undefined =>
    Array.from(host.querySelectorAll('button')).find((b) => b.textContent?.trim() === name);
  const saved = (): EditableFamilyProfile => familyService.saveProfile.mock.calls.at(-1)![0];

  it('loads the family and renders the home step under Step 1 of 4', async () => {
    await mount();
    expect(familyService.load).toHaveBeenCalledTimes(1);
    expect(stepperLabel()).toBe('Step 1 of 4');
    expect(host.querySelector('h1.auth-card__title')?.textContent?.trim()).toBe("Where's home?");
    expect(host.querySelector('.auth-card__sub')?.textContent?.trim()).toBe(
      'Weather and drive times start here.',
    );
    expect(buttonNamed('Back')).toBeUndefined();
    expect(buttonNamed('Skip for now')).toBeDefined();
    expect(continueButton().disabled).toBe(true);
  });

  it('seeds the home field from the stored profile', async () => {
    editable.set({ ...PROFILE, homeLocation: 'Streetsville' });
    await mount();
    expect(component['home']()).toBe('Streetsville');
    expect(continueButton().disabled).toBe(false);
  });

  it('saves the trimmed home on Continue and moves to the family step', async () => {
    await mount();
    component['home'].set('  Port Credit, Mississauga ');
    fixture.detectChanges();
    expect(continueButton().disabled).toBe(false);
    await component['continueStep']();
    expect(familyService.saveProfile).toHaveBeenCalledTimes(1);
    expect(saved().homeLocation).toBe('Port Credit, Mississauga');
    expect(navigate).toHaveBeenCalledWith(['/welcome', 'family']);
  });

  it('does not save a blank home', async () => {
    await mount();
    component['home'].set('   ');
    await component['continueStep']();
    expect(familyService.saveProfile).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('keeps the step open with the error banner when the save fails', async () => {
    familyService.saveProfile.mockRejectedValueOnce(new Error('boom'));
    const silence = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await mount();
    component['home'].set('Port Credit');
    await component['continueStep']();
    fixture.detectChanges();
    expect(host.querySelector('.banner--warn[role="alert"]')?.textContent?.trim()).toBe(
      'That did not save. Try again in a moment.',
    );
    expect(navigate).not.toHaveBeenCalled();
    silence.mockRestore();
  });

  it('skips without saving and goes back a step', async () => {
    await mount('family');
    expect(stepperLabel()).toBe('Step 2 of 4');
    expect(title()).toBe("Who's in?");
    await component['skip']();
    expect(familyService.saveProfile).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/welcome', 'likes']);
    await component['back']();
    expect(navigate).toHaveBeenCalledWith(['/welcome', 'home']);
  });

  it('sends an unknown step back to home', async () => {
    await mount('nope');
    expect(title()).toBe("Where's home?");
    expect(navigate).toHaveBeenCalledWith(['/welcome', 'home'], { replaceUrl: true });
  });

  it('follows the route when the step changes', async () => {
    await mount('home');
    params.next('preferences');
    fixture.detectChanges();
    expect(stepperLabel()).toBe('Step 4 of 4');
    expect(title()).toBe('A few preferences');
    params.next('done');
    fixture.detectChanges();
    expect(host.querySelector('sd-stepper')).toBeNull();
    expect(title()).toBe("You're set");
  });

  describe("who's in (L2-160)", () => {
    const rows = (): HTMLElement[] => Array.from(host.querySelectorAll('sd-list-item'));
    const dialogData = (type: unknown): any =>
      dialog.open.mock.calls.find((c) => c[0] === type)?.[1].data;

    it('lists the members with the add row and no list when empty', async () => {
      await mount('family');
      expect(host.querySelector('sd-list')).toBeNull();
      expect(host.querySelector('sd-ghost-row')?.textContent?.trim()).toBe('Add a family member');
      view.set({ ...VIEW, members: [MAE] });
      fixture.detectChanges();
      expect(rows().map((r) => r.querySelector('.list__title')?.textContent?.trim())).toEqual([
        'Mae',
      ]);
      expect(rows()[0]?.querySelector('.list__sub')?.textContent?.trim()).toBe('Kid · 5');
    });

    it('adds a member through D17b and opens D30 for an invite', async () => {
      dialog.open
        .mockReturnValueOnce({
          closed: of({ kind: 'save', name: 'Sara', age: 36, email: 'sara@example.com' }),
        })
        .mockReturnValueOnce({ closed: of(undefined) });
      familyService.addMember.mockResolvedValueOnce({
        email: 'sara@example.com',
        token: 't',
        url: 'http://localhost/accept-invite?token=t',
        expiresAtUtc: '2026-10-27T00:00:00Z',
      });
      await mount('family');
      await component['addMember']();
      expect(dialogData(FamilyMemberDialog)).toEqual({ mode: 'add', existingNames: [] });
      expect(familyService.addMember).toHaveBeenCalledWith({
        name: 'Sara',
        age: 36,
        email: 'sara@example.com',
      });
      expect(dialogData(InviteLinkDialog)).toEqual({
        name: 'Sara',
        email: 'sara@example.com',
        url: 'http://localhost/accept-invite?token=t',
      });
    });

    it('explains a refused add in the banner', async () => {
      dialog.open.mockReturnValueOnce({
        closed: of({ kind: 'save', name: 'Mae', age: 5, email: null }),
      });
      familyService.addMember.mockRejectedValueOnce({ error: { code: 'member_name_in_use' } });
      await mount('family');
      await component['addMember']();
      fixture.detectChanges();
      expect(host.querySelector('.banner--warn')?.textContent?.trim()).toBe(
        'Someone in the family already has that name.',
      );
      expect(dialog.open.mock.calls.some((c) => c[0] === InviteLinkDialog)).toBe(false);
    });

    it('re-ages a tapped member through D17 and the profile save', async () => {
      dialog.open.mockReturnValueOnce({
        closed: of({ kind: 'save', name: 'Mae', age: 6, email: null }),
      });
      view.set({ ...VIEW, members: [MAE] });
      editable.set({ ...PROFILE, members: [{ id: 'm-mae', name: 'Mae', age: 5 }] });
      await mount('family');
      await component['editMember'](MAE);
      expect(dialogData(FamilyMemberDialog)).toMatchObject({
        mode: 'edit',
        initial: { name: 'Mae', age: 5 },
        access: 'None',
      });
      expect(saved().members).toEqual([{ id: 'm-mae', name: 'Mae', age: 6 }]);
      expect(navigate).not.toHaveBeenCalled();
    });

    it('removes a member after D21 confirms', async () => {
      dialog.open
        .mockReturnValueOnce({ closed: of({ kind: 'remove' }) })
        .mockReturnValueOnce({ closed: of('confirm') });
      view.set({ ...VIEW, members: [MAE] });
      await mount('family');
      await component['editMember'](MAE);
      expect(dialogData(ConfirmDialog)).toMatchObject({
        title: 'Remove Mae from the family?',
        body: 'Future weekends will not plan for them.',
        confirmLabel: 'Remove',
        danger: true,
      });
      expect(familyService.removeMember).toHaveBeenCalledWith('m-mae');
      expect(familyService.saveProfile).not.toHaveBeenCalled();
    });

    it('keeps a member whose removal is cancelled', async () => {
      dialog.open
        .mockReturnValueOnce({ closed: of({ kind: 'remove' }) })
        .mockReturnValueOnce({ closed: of(undefined) });
      await mount('family');
      await component['editMember'](MAE);
      expect(familyService.removeMember).not.toHaveBeenCalled();
    });
  });
});
