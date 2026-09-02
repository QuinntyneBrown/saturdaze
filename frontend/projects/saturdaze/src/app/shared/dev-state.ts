import { ActivatedRoute } from '@angular/router';

import { environment } from '../../environments/environment';

/**
 * `?state=empty|generating|error|…` lets the design harness render a page in
 * one of its static states (the mocks' `#state-*` ids) without driving the
 * backend into it. Honoured only when `environment.galleryRoutes` is true —
 * a compile-time constant, so production builds drop the branch entirely.
 */
export function devState(route: ActivatedRoute): string | null {
  if (!environment.galleryRoutes) return null;
  return route.snapshot.queryParamMap.get('state');
}
