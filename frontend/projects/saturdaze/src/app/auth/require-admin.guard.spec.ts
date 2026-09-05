import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router, UrlTree, convertToParamMap } from '@angular/router';
import { SESSION_STORE } from 'api';
import { requireAdmin } from './require-admin.guard';

describe('requireAdmin', () => {
  const isAuthenticated = signal(false);
  const user = signal<any>(null);
  let router: Router;

  const run = () => {
    const route = { paramMap: convertToParamMap({}), queryParamMap: convertToParamMap({}), params: {}, queryParams: {}, data: {}, url: [] } as any;
    return TestBed.runInInjectionContext(() =>
      (requireAdmin as unknown as (...args: any[]) => unknown)(route, { url: '/admin/events' } as any),
    );
  };

  beforeEach(() => {
    isAuthenticated.set(false);
    user.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        { provide: SESSION_STORE, useValue: { isAuthenticated, user } },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('bounces anonymous visitors to /sign-in', () => {
    const result = run();
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/sign-in');
  });

  it('bounces signed-in non-admins to /weekend', () => {
    isAuthenticated.set(true);
    user.set({ id: 'u1', email: 'a@b.c', role: 'User', emailVerifiedUtc: null });
    const result = run();
    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/weekend');
  });

  it('lets admins through', () => {
    isAuthenticated.set(true);
    user.set({ id: 'u1', email: 'admin@b.c', role: 'Admin', emailVerifiedUtc: null });
    expect(run()).toBe(true);
  });
});
