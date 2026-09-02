import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { environment } from '../../environments/environment';
import { devState } from './dev-state';

function routeWith(query: Record<string, string>): ActivatedRoute {
  return { snapshot: { queryParamMap: convertToParamMap(query) } } as unknown as ActivatedRoute;
}

describe('devState', () => {
  it('is honoured in development builds (gallery routes on)', () => {
    expect(environment.galleryRoutes).toBe(true);
  });

  it('reads ?state= from the route snapshot', () => {
    expect(devState(routeWith({ state: 'empty' }))).toBe('empty');
    expect(devState(routeWith({ state: 'generating', other: 'x' }))).toBe('generating');
  });

  it('is null when the query is absent', () => {
    expect(devState(routeWith({}))).toBeNull();
    expect(devState(routeWith({ other: 'x' }))).toBeNull();
  });

  // The production branch (`galleryRoutes: false` → always null) is a
  // compile-time constant swapped in by fileReplacements; the Angular unit-test
  // builder does not support vi.mock on relative imports, so it is not
  // exercised here.
});
