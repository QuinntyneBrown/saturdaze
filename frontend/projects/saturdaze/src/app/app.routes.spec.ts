import { routes } from './app.routes';

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
});
