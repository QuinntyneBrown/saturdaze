import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SESSION_STORE } from 'api';

import { App } from './app';

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('Admin App shell', () => {
  let fixture: ComponentFixture<App>;
  let host: HTMLElement;
  let router: Router;
  let session: {
    loading: ReturnType<typeof signal<boolean>>;
    user: ReturnType<typeof signal<any>>;
    logout: ReturnType<typeof vi.fn>;
  };

  const user = (role: 'User' | 'Admin') => ({
    id: 'u1',
    email: 'someone@example.com',
    role,
    emailVerifiedUtc: null,
    avatarUrl: null,
  });

  beforeEach(async () => {
    session = {
      loading: signal(false),
      user: signal(user('Admin')),
      logout: vi.fn(async () => undefined),
    };
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'sign-in', children: [], data: { shell: 'bare', screen: 'sign-in' } },
          { path: 'places', children: [], data: { nav: 'places', screen: 'places' } },
        ]),
        { provide: SESSION_STORE, useValue: session },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete document.body.dataset['page'];
    delete document.body.dataset['screen'];
  });

  it('shows the loading curtain while the session rehydrates', () => {
    session.loading.set(true);
    fixture.detectChanges();
    expect(host.querySelector('.sd-app-loading')).not.toBeNull();
    expect(host.querySelector('sd-admin-nav')).toBeNull();
  });

  it('renders the side navigation with the current screen for an administrator', async () => {
    await router.navigateByUrl('/places');
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    expect(document.body.dataset['page']).toBe('admin');
    expect(document.body.dataset['screen']).toBe('places');
    const current = host.querySelector('.admin-nav__link[aria-current="page"]');
    expect(current?.getAttribute('data-nav')).toBe('places');
    expect(host.querySelector('.admin-nav__email')?.textContent).toContain('someone@example.com');
    expect(host.querySelector('sd-admin-gate')).toBeNull();
  });

  it('replaces the outlet with the gate for a signed-in non-administrator', async () => {
    session.user.set(user('User'));
    await router.navigateByUrl('/places');
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    expect(host.querySelector('sd-admin-gate')).not.toBeNull();
    expect(host.querySelector('.auth-card__title')?.textContent).toContain(
      "This account can't use Saturdaze Admin",
    );
    expect(host.querySelector('.email-chip')?.textContent).toContain('someone@example.com');
    expect(host.querySelector('sd-admin-nav')).toBeNull();
    expect(host.querySelector('router-outlet')).toBeNull();
  });

  it('lets the sign-in screen own the viewport', async () => {
    session.user.set(null);
    await router.navigateByUrl('/sign-in');
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    expect(host.querySelector('main.sd-frame--bare router-outlet')).not.toBeNull();
    expect(host.querySelector('sd-admin-nav')).toBeNull();
    expect(host.querySelector('sd-admin-gate')).toBeNull();
  });

  it('signs out and returns to sign-in', async () => {
    await router.navigateByUrl('/places');
    fixture.detectChanges();
    await settle();
    fixture.detectChanges();
    (host.querySelector('.admin-nav__account button') as HTMLButtonElement).click();
    await settle();
    expect(session.logout).toHaveBeenCalledTimes(1);
    expect(router.url).toBe('/sign-in');
  });
});
