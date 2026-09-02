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
import { BottomNav, NavKey, Sitebar, TopBar } from 'components';

import { MenuOpener } from './shell/menu-opener';
import { signOutWith } from './shared/sign-out';

/**
 * Application shell (docs/mocks-v2 · Shell spec).
 *
 * Renders the chrome ONCE, driven by route data merged along the active
 * route's ancestry (so `/ideas/food` inherits `nav: 'ideas'` from `/ideas`):
 *
 * - `shell: 'app'` (default) — `sd-top-bar` from 720px, `sd-bottom-nav`
 *   below, `<main class="sd-frame">` between them.
 * - `shell: 'site'` — public pages: `sd-sitebar` on top (with the sign-up
 *   CTA when `cta: true`), no bottom nav.
 * - `shell: 'bare'` — auth pages own the whole viewport.
 *
 * `nav` names the current primary destination; `page` is the slug stamped
 * on `<body data-page>` (the e2e anchor). The one outlet stays mounted while
 * the chrome toggles so routed components are never constructed twice.
 *
 * On bootstrap the SessionStore rehydrates from storage; the outlet stays
 * gated on `loading()` so guards see authoritative state on first paint.
 */

export type AppShell = 'app' | 'bare' | 'site';

interface ShellData {
  readonly shell: AppShell;
  readonly nav: NavKey | null;
  readonly page: string;
  readonly cta: boolean;
}

const DEFAULT_SHELL: ShellData = { shell: 'app', nav: null, page: '', cta: false };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TopBar, BottomNav, Sitebar],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly document = inject(DOCUMENT);
  private readonly session = inject(SESSION_STORE);
  private readonly menus = inject(MenuOpener);

  private readonly shellData = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.readShellData()),
      startWith(DEFAULT_SHELL),
    ),
    { initialValue: DEFAULT_SHELL },
  );

  protected readonly shell = computed(() => this.shellData().shell);
  protected readonly nav = computed(() => this.shellData().nav);
  protected readonly siteCta = computed(() => this.shellData().cta);
  protected readonly email = computed(() => this.session.user()?.email ?? '');
  protected readonly loading = this.session.loading;

  constructor() {
    effect(() => {
      const data = this.shellData();
      const body = this.document.body;
      body.dataset['shell'] = data.shell;
      if (data.page) body.dataset['page'] = data.page;
      else delete body.dataset['page'];
    });
  }

  protected async openAccountMenu(anchor: HTMLElement): Promise<void> {
    const picked = await this.menus.open(anchor, {
      title: 'Account',
      header: this.email(),
      items: [
        { id: 'family', label: 'Family settings', icon: 'user', href: '/family' },
        { id: 'sign-out', label: 'Sign out', icon: 'sign_out', tone: 'warn' },
      ],
    });
    if (picked?.id === 'sign-out') {
      await signOutWith(this.menus.dialog, this.session, this.router);
    }
  }

  private readShellData(): ShellData {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    const merged = Object.assign({}, ...route.pathFromRoot.map((r) => r.snapshot.data)) as Record<
      string,
      unknown
    >;
    const shell = merged['shell'];
    const nav = merged['nav'];
    const page = merged['page'];
    return {
      shell: shell === 'bare' || shell === 'site' ? shell : 'app',
      nav: typeof nav === 'string' ? (nav as NavKey) : null,
      page: typeof page === 'string' ? page : '',
      cta: merged['cta'] === true,
    };
  }
}
