import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';

import {
  ADMIN_AUDIT_SERVICE,
  AuditPageView,
  AuditRow,
  DEFAULT_PHOTO_AUDIT_QUERY,
  PhotoAuditQuery,
} from 'api';
import {
  Banner,
  Chip,
  Empty,
  List,
  PageHeader,
  Pager,
  Select,
  SelectOption,
  StatusRow,
  Toolbar,
} from 'components';

import { chipTone } from '../../shared/chip-tones';

const ALL_PLACES = '';
const EVERYONE = '';

/** Reads the log's filters from the URL; a bad value falls back to the default. */
export function parseAuditQuery(get: (key: string) => string | null): PhotoAuditQuery {
  const kind = get('kind');
  const page = Number(get('page') ?? '1');
  return {
    kind: kind === 'Activity' || kind === 'Restaurant' || kind === 'LocalEvent' ? kind : null,
    placeId: get('placeId'),
    adminId: get('adminId'),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function toAuditParams(query: PhotoAuditQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.kind && query.placeId) {
    params['kind'] = query.kind;
    params['placeId'] = query.placeId;
  }
  if (query.adminId) params['adminId'] = query.adminId;
  if (query.page > 1) params['page'] = String(query.page);
  return params;
}

/**
 * Activity log (A7) — `docs/mocks/pages/admin.activity.html`: every photo
 * change newest first with who, when (UTC), the place, the action and
 * what changed, filterable by place and administrator (L2-122). The
 * filters live in the URL so a log view can be shared.
 */
@Component({
  selector: 'sd-admin-activity-log',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Banner,
    Chip,
    Empty,
    List,
    PageHeader,
    Pager,
    Select,
    StatusRow,
    Toolbar,
  ],
  templateUrl: './activity-log.page.html',
  styleUrl: './activity-log.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogPage {
  private readonly audit = inject(ADMIN_AUDIT_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly query = toSignal(
    this.route.queryParamMap.pipe(map((params) => parseAuditQuery((k) => params.get(k)))),
    { initialValue: DEFAULT_PHOTO_AUDIT_QUERY },
  );

  protected readonly status = signal<'loading' | 'ready'>('loading');
  protected readonly view = signal<AuditPageView>({ rows: [], total: 0, page: 1, pageSize: 50 });
  protected readonly error = signal('');
  protected readonly chipTone = chipTone;

  /** The places and administrators seen so far, so the selects offer what the log holds. */
  private readonly places = signal<
    Map<string, { kind: AuditRow['kind']; id: string; name: string }>
  >(new Map());
  private readonly admins = signal<Map<string, string>>(new Map());

  protected readonly placeOptions = computed<readonly SelectOption[]>(() => [
    { value: ALL_PLACES, label: 'All places' },
    ...Array.from(this.places().values())
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({ value: `${p.kind}/${p.id}`, label: p.name })),
  ]);
  protected readonly adminOptions = computed<readonly SelectOption[]>(() => [
    { value: EVERYONE, label: 'Everyone' },
    ...Array.from(this.admins().entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([id, email]) => ({ value: id, label: email })),
  ]);

  protected readonly place = new FormControl(ALL_PLACES, { nonNullable: true });
  protected readonly admin = new FormControl(EVERYONE, { nonNullable: true });

  constructor() {
    effect(() => {
      const q = this.query();
      this.place.setValue(q.kind && q.placeId ? `${q.kind}/${q.placeId}` : ALL_PLACES, {
        emitEvent: false,
      });
      this.admin.setValue(q.adminId ?? EVERYONE, { emitEvent: false });
      void this.load(q);
    });
    this.place.valueChanges.pipe(distinctUntilChanged(), takeUntilDestroyed()).subscribe((v) => {
      const [kind, placeId] = v.split('/');
      this.apply({
        kind: (kind as PhotoAuditQuery['kind']) || null,
        placeId: placeId || null,
        page: 1,
      });
    });
    this.admin.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((adminId) => this.apply({ adminId: adminId || null, page: 1 }));
  }

  protected goToPage(page: number): void {
    this.apply({ page });
  }

  private apply(patch: Partial<PhotoAuditQuery>): void {
    const next = toAuditParams({ ...this.query(), ...patch });
    if (JSON.stringify(next) === JSON.stringify(toAuditParams(this.query()))) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: next });
  }

  private async load(query: PhotoAuditQuery): Promise<void> {
    this.error.set('');
    try {
      const page = await this.audit.list(query);
      this.view.set(page);
      this.remember(page.rows);
      this.status.set('ready');
    } catch (err) {
      this.status.set('ready');
      this.error.set('Could not load the log. Try again in a moment.');
      console.error('ActivityLogPage load failed', err);
    }
  }

  private remember(rows: readonly AuditRow[]): void {
    this.places.update((m) => {
      const next = new Map(m);
      for (const r of rows)
        next.set(`${r.kind}/${r.placeId}`, { kind: r.kind, id: r.placeId, name: r.placeName });
      return next;
    });
    this.admins.update((m) => {
      const next = new Map(m);
      for (const r of rows) next.set(r.adminId, r.who);
      return next;
    });
  }
}
