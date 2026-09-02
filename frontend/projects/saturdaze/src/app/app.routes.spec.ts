import { routes } from './app.routes';
import { requireAdmin } from './auth/require-admin.guard';
import { requireAuth } from './auth/require-auth.guard';

describe('app.routes', () => {
  it('should define a path and a target for every route in routes', () => {
    expect(Array.isArray(routes)).toBe(true);
    for (const route of routes as any[]) {
      expect(route.path !== undefined || route.redirectTo !== undefined || route.matcher !== undefined).toBe(true);
      const hasTarget = route.component !== undefined || route.loadComponent !== undefined
        || route.loadChildren !== undefined || route.children !== undefined || route.redirectTo !== undefined;
      expect(hasTarget).toBe(true);
    }
  });

  it('registers /admin/events behind requireAuth then requireAdmin', () => {
    const admin = routes.find((r) => r.path === 'admin/events');
    expect(admin).toBeDefined();
    expect(admin!.canActivate).toEqual([requireAuth, requireAdmin]);
    expect(admin!.loadComponent).toBeTypeOf('function');
  });

  it('guards every signed-in surface with requireAuth', () => {
    const guarded = ['weekend', 'itinerary', 'activities', 'restaurants', 'saved', 'events', 'events/submit', 'events/submitted', 'errand', 'profile'];
    for (const path of guarded) {
      const route = routes.find((r) => r.path === path);
      expect(route?.canActivate, path).toContain(requireAuth);
    }
  });
});
