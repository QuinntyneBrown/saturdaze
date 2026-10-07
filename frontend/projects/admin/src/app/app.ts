import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { SESSION_STORE } from 'api';
import { AdminGate, AdminNav, AdminNavKey } from 'components';

import { environment } from '../environments/environment';

/**
 * Saturdaze Admin shell (ADR-014; docs/mocks/pages/admin.*.html).
 *
 * Renders the chrome once from route data: `shell: 'bare'` (sign-in) is the
 * outlet alone; otherwise, for an administrator, `sd-admin-nav` beside the
 * outlet inside the `.admin` grid. A signed-in account whose role is not
 * `Admin` gets `sd-admin-gate` instead of the outlet, so no admin screen is
 * constructed and nothing from `/api/admin/*` is requested (L2-111 AC1).
 *
 * `<body>` carries `data-page="admin"` on every screen and `data-screen`
 * from route data (the e2e anchors). The outlet stays gated on
 * `SessionStore.loading()` so the guards see authoritative state.
 */

interface ShellData {
  readonly bare: boolean;
  readonly nav: AdminNavKey | null;
  readonly screen: string;
}

const DEFAULT_SHELL: ShellData = { bare: false, nav: null, screen: '' };

@Component({
  selector: 'sd-admin-root',
  standalone: true,
  imports: [RouterOutlet, AdminNav, AdminGate],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly session = inject(SESSION_STORE);

  private readonly shellData = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.readShellData()),
      startWith(DEFAULT_SHELL),
    ),
    { initialValue: DEFAULT_SHELL },
  );

  protected readonly bare = computed(() => this.shellData().bare);
  protected readonly nav = computed(() => this.shellData().nav);
  protected readonly email = computed(() => this.session.user()?.email ?? '');
  protected readonly avatarUrl = computed(() => this.session.user()?.avatarUrl ?? null);
  protected readonly gated = computed(() => {
    const user = this.session.user();
    return user !== null && user.role !== 'Admin';
  });
  protected readonly loading = this.session.loading;
  protected readonly familyAppUrl = environment.familyAppUrl;

  constructor() {
    effect(() => {
      const data = this.shellData();
      const body = this.document.body;
      body.dataset['page'] = 'admin';
      if (data.screen) body.dataset['screen'] = data.screen;
      else delete body.dataset['screen'];
    });
  }

  /** Revokes the session and shows sign-in (L2-111 AC5). */
  protected async signOut(): Promise<void> {
    await this.session.logout();
    await this.router.navigateByUrl('/sign-in');
  }

  private readShellData(): ShellData {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    const merged = Object.assign({}, ...route.pathFromRoot.map((r) => r.snapshot.data)) as Record<
      string,
      unknown
    >;
    const nav = merged['nav'];
    const screen = merged['screen'];
    return {
      bare: merged['shell'] === 'bare',
      nav: typeof nav === 'string' ? (nav as AdminNavKey) : null,
      screen: typeof screen === 'string' ? screen : '',
    };
  }
}
