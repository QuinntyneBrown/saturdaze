import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  EditableFamilyProfile,
  FAMILY_SERVICE,
  IFamilyService,
  ISessionStore,
  SESSION_STORE,
  User,
} from 'api';

import { ProfilePage } from './profile.page';

/**
 * Unit coverage for `ProfilePage.signOut()` — the only branchy logic the
 * page added for the sign-out flow. The dialog component itself is covered
 * by `sign-out-dialog.spec.ts`; full DOM wire-up is covered by
 * `e2e/tests/sign-out.spec.ts`. This spec asserts that the dialog result
 * is the sole gate on `SessionStore.logout()` + the `/login` navigation.
 */
describe('ProfilePage.signOut()', () => {
  let logoutSpy: ReturnType<typeof vi.fn<() => void>>;
  let navigateSpy: ReturnType<typeof vi.fn<(url: string) => Promise<boolean>>>;
  let dialogOpenSpy: ReturnType<
    typeof vi.fn<(component: unknown, config: unknown) => DialogRef<unknown>>
  >;
  let userSignal: ReturnType<typeof signal<User | null>>;

  function configure(closed$: Observable<'confirm' | undefined>): ProfilePage {
    logoutSpy = vi.fn<() => void>();
    navigateSpy = vi.fn<(url: string) => Promise<boolean>>().mockResolvedValue(true);
    dialogOpenSpy = vi
      .fn<(component: unknown, config: unknown) => DialogRef<unknown>>()
      .mockReturnValue({ closed: closed$ } as unknown as DialogRef<unknown>);
    userSignal = signal<User | null>({
      id: 'u1',
      email: 'quinntynebrown@gmail.com',
      role: 'User',
      emailVerifiedUtc: null,
    });

    const familyStub: Partial<IFamilyService> = {
      getProfile: () => signal({} as never),
      getEditableProfile: () => signal<EditableFamilyProfile | null>(null),
      load: () => Promise.resolve(),
      saveProfile: () => Promise.resolve(),
    };
    const sessionStub: Partial<ISessionStore> = {
      user: userSignal,
      logout: logoutSpy,
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: FAMILY_SERVICE, useValue: familyStub },
        { provide: SESSION_STORE, useValue: sessionStub },
        { provide: Dialog, useValue: { open: dialogOpenSpy } },
        { provide: Router, useValue: { navigateByUrl: navigateSpy } },
      ],
    });

    return TestBed.runInInjectionContext(() => new ProfilePage());
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('logs out and routes to /login when the dialog resolves "confirm"', async () => {
    const page = configure(of<'confirm' | undefined>('confirm'));

    await (page as unknown as { signOut: () => Promise<void> }).signOut();

    expect(dialogOpenSpy).toHaveBeenCalledOnce();
    const [, config] = dialogOpenSpy.mock.calls[0]!;
    expect((config as { data: { email: string } }).data.email).toBe(
      'quinntynebrown@gmail.com',
    );
    expect(logoutSpy).toHaveBeenCalledOnce();
    expect(navigateSpy).toHaveBeenCalledExactlyOnceWith('/login');
  });

  it('does nothing when the dialog resolves undefined (cancel/Esc/backdrop)', async () => {
    const page = configure(of<'confirm' | undefined>(undefined));

    await (page as unknown as { signOut: () => Promise<void> }).signOut();

    expect(dialogOpenSpy).toHaveBeenCalledOnce();
    expect(logoutSpy).not.toHaveBeenCalled();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('passes an empty email to the dialog when the session has no user', async () => {
    const page = configure(of<'confirm' | undefined>(undefined));
    userSignal.set(null);

    await (page as unknown as { signOut: () => Promise<void> }).signOut();

    const [, config] = dialogOpenSpy.mock.calls[0]!;
    expect((config as { data: { email: string } }).data.email).toBe('');
  });
});
