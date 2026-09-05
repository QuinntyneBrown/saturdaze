import { TestBed } from '@angular/core/testing';
import { Route, Router, UrlTree, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { requireAdmin } from './auth/require-admin.guard';
import { requireAnonymous } from './auth/require-anonymous.guard';
import { requireAuth } from './auth/require-auth.guard';

const find = (path: string): Route | undefined => routes.find((r) => r.path === path);

describe('app.routes', () => {
  it('defines a path and a target for every route', () => {
    for (const route of routes) {
      expect(route.path).toBeDefined();
      const hasTarget =
        route.loadComponent !== undefined || route.children !== undefined || route.redirectTo !== undefined;
      expect(hasTarget, route.path).toBe(true);
    }
  });

  it('registers every v2 page', () => {
    const pages = [
      '',
      'sign-in',
      'create-account',
      'reset-password',
      'verify-email',
      'legal',
      'sample-weekend',
      'weekend',
      'ideas',
      'past',
      'family',
      'review-submissions',
    ];
    for (const path of pages) {
      expect(find(path)?.loadComponent, path).toBeTypeOf('function');
    }
  });

  it('nests the three Ideas segments under /ideas with their subtitles', () => {
    const ideas = find('ideas')!;
    expect(ideas.children?.map((c) => c.path)).toEqual(['', 'food', 'events']);
    expect(ideas.children?.[0]?.pathMatch).toBe('full');
    for (const child of ideas.children ?? []) {
      expect(child.loadComponent).toBeTypeOf('function');
      expect(child.data?.['subtitle']).toBeTypeOf('string');
    }
  });

  it('guards the signed-in surfaces with requireAuth', () => {
    for (const path of ['weekend', 'ideas', 'past', 'family']) {
      expect(find(path)?.canActivate, path).toEqual([requireAuth]);
    }
    expect(find('review-submissions')?.canActivate).toEqual([requireAuth, requireAdmin]);
  });

  it('keeps signed-in users off the public entry pages, and verify-email open to everyone', () => {
    for (const path of ['', 'sign-in', 'create-account', 'reset-password']) {
      expect(find(path)?.canActivate, path).toEqual([requireAnonymous]);
    }
    for (const path of ['verify-email', 'legal', 'sample-weekend']) {
      expect(find(path)?.canActivate, path).toBeUndefined();
    }
  });

  it('carries the shell data the app chrome reads', () => {
    expect(find('')?.data).toEqual({ shell: 'site', cta: true, page: 'landing' });
    expect(find('sample-weekend')?.data).toEqual({ shell: 'site', cta: true, page: 'shared-weekend' });
    expect(find('legal')?.data).toEqual({ shell: 'site', page: 'legal' });
    for (const path of ['sign-in', 'create-account', 'reset-password', 'verify-email']) {
      expect(find(path)?.data?.['shell'], path).toBe('bare');
      expect(find(path)?.data?.['page'], path).toBe(path);
    }
    expect(find('weekend')?.data).toEqual({ nav: 'weekend', page: 'weekend' });
    expect(find('ideas')?.data).toEqual({ nav: 'ideas', page: 'ideas' });
    expect(find('past')?.data).toEqual({ nav: 'past', page: 'past' });
    expect(find('family')?.data).toEqual({ nav: 'family', page: 'family' });
    expect(find('review-submissions')?.data).toEqual({ nav: 'family', page: 'review-submissions' });
  });

  it('ships the dialogs gallery in development only', () => {
    // environment.ts (galleryRoutes: true) is what the test build compiles in.
    const gallery = find('dialogs');
    expect(gallery?.loadComponent).toBeTypeOf('function');
    expect(gallery?.data).toEqual({ shell: 'site', page: 'dialogs' });
    expect(gallery?.canActivate).toBeUndefined();
  });

  it('redirects every v1 path to its v2 home', () => {
    const expected: Record<string, string> = {
      itinerary: '/weekend',
      errand: '/weekend',
      activities: '/ideas',
      restaurants: '/ideas/food',
      events: '/ideas/events',
      'events/submit': '/ideas/events',
      'events/submitted': '/ideas/events',
      saved: '/past',
      profile: '/family',
      'admin/events': '/review-submissions',
      login: '/sign-in',
      signup: '/create-account',
      'forgot-password': '/reset-password',
      'check-email': '/reset-password',
      terms: '/legal',
    };
    for (const [path, target] of Object.entries(expected)) {
      const route = find(path);
      expect(route?.redirectTo, path).toBe(target);
      expect(route?.pathMatch, path).toBe('full');
    }
  });

  it('redirects /privacy to the policy fragment on /legal', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const redirect = find('privacy')?.redirectTo;
    expect(redirect).toBeTypeOf('function');
    const tree = TestBed.runInInjectionContext(() => (redirect as () => UrlTree)());
    expect(TestBed.inject(Router).serializeUrl(tree)).toBe('/legal#privacy');
  });

  it('sends unknown paths to the landing page, as the last route', () => {
    const last = routes[routes.length - 1]!;
    expect(last.path).toBe('**');
    expect(last.redirectTo).toBe('');
  });

  it('lazy-loads real components', async () => {
    // Dev builds prefix class names with an underscore, so match the tail.
    const weekend = await find('weekend')!.loadComponent!();
    expect((weekend as { name: string }).name).toMatch(/WeekendPage$/);
    const food = await find('ideas')!.children![1]!.loadComponent!();
    expect((food as { name: string }).name).toMatch(/IdeasFoodPage$/);
  });
});
