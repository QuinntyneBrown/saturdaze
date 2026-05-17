import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterOutlet,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { SESSION_STORE } from 'api';

/**
 * Application shell.
 *
 * Three body modes, picked up from the deepest active route's `data.shell`:
 *
 * - `undefined` (default) — wraps `<router-outlet>` in `.sd-frame`, the
 *   phone-canvas with rail/bottom-nav offsets. Body stays the default
 *   `flex; justify-content: center`.
 * - `'splash'` — bare body (`display: block`) so the marketing splash can
 *   run edge-to-edge up to 1120px. No `.sd-frame` wrapper.
 * - `'auth'` — body centers the auth card (`flex; column; align-items;
 *   justify-content: center; padding: 24px`). No `.sd-frame` wrapper. The
 *   six auth pages use this.
 *
 * On bootstrap the SessionStore rehydrates from local/session storage; the
 * router outlet stays gated on `loading()` so guards see authoritative
 * state on the first paint.
 */

export type AppShell = 'splash' | 'auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly session = inject(SESSION_STORE);

  private readonly shell = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((): AppShell | undefined =>
        this.deepestRoute().snapshot.data['shell'] as AppShell | undefined,
      ),
      startWith<AppShell | undefined>(undefined),
    ),
    { initialValue: undefined as AppShell | undefined },
  );

  protected readonly chrome = computed(() => !this.shell());
  protected readonly loading = this.session.loading;

  constructor() {
    effect(() => {
      const s = this.shell();
      this.document.body.classList.toggle('sd-body--bare', s === 'splash');
      this.document.body.classList.toggle('sd-body--auth', s === 'auth');
    });
    void this.session.rehydrate();
  }

  private deepestRoute(): ActivatedRoute {
    let r = this.activatedRoute;
    while (r.firstChild) r = r.firstChild;
    return r;
  }
}
