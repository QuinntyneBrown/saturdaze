import { vi } from 'vitest';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { SESSION_STORE } from 'api';

import { App } from './app';
import { MenuOpener } from './shell/menu-opener';

/** Flush every pending microtask (the app is zoneless, so whenStable cannot see mocked promises). */
const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('App', () => {
  let fixture: ComponentFixture<App>;
  let host: HTMLElement;
  let router: Router;
  let session: {
    loading: ReturnType<typeof signal<boolean>>;
    user: ReturnType<typeof signal<any>>;
    logout: ReturnType<typeof vi.fn>;
  };
  let menus: { open: ReturnType<typeof vi.fn>; dialog: { open: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    session = {
      loading: signal(false),
      user: signal({ id: 'u1', email: 'quinn@example.com', role: 'User', emailVerifiedUtc: null }),
      logout: vi.fn(async () => undefined),
    };
    menus = { open: vi.fn(async () => undefined), dialog: { open: vi.fn(() => ({ closed: of('confirm') })) } };
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', children: [], data: { shell: 'site', cta: true, page: 'landing' } },
          { path: 'sign-in', children: [], data: { shell: 'bare', page: 'sign-in' } },
          { path: 'legal', children: [], data: { shell: 'site', page: 'legal' } },
          { path: 'weekend', children: [], data: { nav: 'weekend', page: 'weekend' } },
          {
            path: 'ideas',
            data: { nav: 'ideas', page: 'ideas' },
            children: [{ path: 'food', children: [], data: { subtitle: 'Food' } }],
          },
        ]),
        { provide: SESSION_STORE, useValue: session },
        { provide: MenuOpener, useValue: menus },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(App);
    host = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    delete document.body.dataset['shell'];
    delete document.body.dataset['page'];
  });

  async function go(url: string): Promise<void> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
  }

  it('holds the outlet back while the session rehydrates', () => {
    session.loading.set(true);
    fixture.detectChanges();
    expect(host.querySelector('.sd-app-loading')).not.toBeNull();
    expect(host.querySelector('router-outlet')).toBeNull();
    expect(host.querySelector('sd-top-bar')).toBeNull();
  });

  it('renders the app chrome by default: top bar, one frame with the outlet, bottom nav', () => {
    expect(host.querySelector('sd-top-bar')).not.toBeNull();
    expect(host.querySelector('sd-bottom-nav')).not.toBeNull();
    expect(host.querySelector('sd-sitebar')).toBeNull();
    const main = host.querySelector('main#main.sd-frame');
    expect(main).not.toBeNull();
    expect(main?.querySelector('router-outlet')).not.toBeNull();
    expect(main?.classList.contains('sd-frame--bare')).toBe(false);
    expect(document.body.dataset['shell']).toBe('app');
    expect(document.body.dataset['page']).toBeUndefined();
  });

  it('passes the signed-in email to the top bar', () => {
    expect(host.querySelector('sd-top-bar sd-avatar')?.getAttribute('name')).toBe('quinn@example.com');
  });

  it('switches to the site bar (with the CTA) for public pages', async () => {
    await go('/');
    expect(host.querySelector('sd-top-bar')).toBeNull();
    expect(host.querySelector('sd-bottom-nav')).toBeNull();
    const sitebar = host.querySelector('sd-sitebar');
    expect(sitebar?.hasAttribute('cta')).toBe(true);
    expect(host.querySelector('main')?.classList.contains('sd-frame--site')).toBe(true);
    expect(document.body.dataset['shell']).toBe('site');
    expect(document.body.dataset['page']).toBe('landing');

    await go('/legal');
    expect(host.querySelector('sd-sitebar')?.hasAttribute('cta')).toBe(false);
    expect(document.body.dataset['page']).toBe('legal');
  });

  it('goes bare for auth pages', async () => {
    await go('/sign-in');
    expect(host.querySelector('sd-top-bar')).toBeNull();
    expect(host.querySelector('sd-sitebar')).toBeNull();
    expect(host.querySelector('sd-bottom-nav')).toBeNull();
    expect(host.querySelector('main')?.classList.contains('sd-frame--bare')).toBe(true);
    expect(document.body.dataset['shell']).toBe('bare');
    expect(document.body.dataset['page']).toBe('sign-in');
  });

  it('highlights the primary destination, inherited from the parent route', async () => {
    await go('/weekend');
    expect(host.querySelector('sd-top-bar')?.getAttribute('active')).toBe('weekend');
    expect(host.querySelector('sd-bottom-nav')?.getAttribute('active')).toBe('weekend');

    await go('/ideas/food');
    expect(host.querySelector('sd-top-bar')?.getAttribute('active')).toBe('ideas');
    expect(document.body.dataset['page']).toBe('ideas');
  });

  it('opens the account menu from the avatar and signs out through D22', async () => {
    menus.open.mockResolvedValueOnce({ id: 'sign-out', label: 'Sign out', icon: 'sign_out' });
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    (host.querySelector('sd-top-bar button.avatar-btn') as HTMLButtonElement).click();
    await settle();

    expect(menus.open).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        title: 'Account',
        header: 'quinn@example.com',
        items: [
          { id: 'family', label: 'Family settings', icon: 'user', href: '/family' },
          { id: 'sign-out', label: 'Sign out', icon: 'sign_out', tone: 'warn' },
        ],
      }),
    );
    expect(menus.dialog.open).toHaveBeenCalled();
    expect(session.logout).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/sign-in');
  });

  it('leaves the session alone when the menu is dismissed or Family is picked', async () => {
    menus.open.mockResolvedValueOnce({ id: 'family', label: 'Family settings', icon: 'user', href: '/family' });
    await fixture.componentInstance['openAccountMenu'](document.createElement('button'));
    menus.open.mockResolvedValueOnce(undefined);
    await fixture.componentInstance['openAccountMenu'](document.createElement('button'));
    expect(menus.dialog.open).not.toHaveBeenCalled();
    expect(session.logout).not.toHaveBeenCalled();
  });
});
