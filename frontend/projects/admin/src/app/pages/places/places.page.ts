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
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { placeRowFlags } from '../../shared/chip-tones';
import {
  ADMIN_PLACES_SERVICE,
  AdminPlacesQuery,
  DEFAULT_ADMIN_PLACES_QUERY,
  parseAdminPlacesQuery,
  toAdminPlacesParams,
} from 'api';
import {
  Banner,
  Empty,
  FilterChip,
  Filters,
  Icon,
  List,
  Pager,
  PlaceRow,
  PageHeader,
  Select,
  SelectOption,
  StatusRow,
  TextInput,
  Toolbar,
} from 'components';

/** One chip of the filter row; `patch` is the query change it applies. */
interface FilterChipDef {
  readonly label: string;
  readonly icon?: string;
  readonly tone: 'default' | 'leaf' | 'sun' | 'sky';
  readonly active: (q: AdminPlacesQuery) => boolean;
  readonly patch: (q: AdminPlacesQuery) => Partial<AdminPlacesQuery>;
}

const KIND_CHIPS: readonly FilterChipDef[] = [
  {
    label: 'All kinds',
    tone: 'default',
    active: (q) => q.kind === null,
    patch: () => ({ kind: null }),
  },
  {
    label: 'Activities',
    icon: 'tree',
    tone: 'leaf',
    active: (q) => q.kind === 'Activity',
    patch: (q) => ({ kind: q.kind === 'Activity' ? null : 'Activity' }),
  },
  {
    label: 'Restaurants',
    icon: 'fork',
    tone: 'sun',
    active: (q) => q.kind === 'Restaurant',
    patch: (q) => ({ kind: q.kind === 'Restaurant' ? null : 'Restaurant' }),
  },
  {
    label: 'Events',
    icon: 'ticket',
    tone: 'sky',
    active: (q) => q.kind === 'LocalEvent',
    patch: (q) => ({ kind: q.kind === 'LocalEvent' ? null : 'LocalEvent' }),
  },
];

const flagChip = (label: string, flag: AdminPlacesQuery['flag']): FilterChipDef => ({
  label,
  tone: 'default',
  active: (q) => q.flag === flag,
  patch: (q) => ({ flag: q.flag === flag ? null : flag }),
});

const FLAG_CHIPS: readonly FilterChipDef[] = [
  flagChip('No photo', 'no-photo'),
  flagChip('Blocked URL', 'blocked-url'),
  flagChip('Unreviewed', 'unreviewed'),
  flagChip('Missing alt text', 'missing-alt'),
];

const SOURCE_CHIPS: readonly FilterChipDef[] = [
  {
    label: 'Primary is curated',
    tone: 'default',
    active: (q) => q.source === 'Curated',
    patch: (q) => ({ source: q.source === 'Curated' ? null : 'Curated' }),
  },
  {
    label: 'Primary is provider',
    tone: 'default',
    active: (q) => q.source === 'Provider',
    patch: (q) => ({ source: q.source === 'Provider' ? null : 'Provider' }),
  },
  {
    label: 'Upcoming events only',
    tone: 'default',
    active: (q) => q.upcoming,
    patch: (q) => ({ upcoming: !q.upcoming }),
  },
];

const SORT_OPTIONS: readonly SelectOption[] = [
  { value: 'health', label: 'Worst health first' },
  { value: 'name', label: 'Name' },
  { value: 'changed', label: 'Recently changed' },
];

/**
 * Places (A3) — `docs/mocks/pages/admin.places.html`: every catalog place
 * as a row with its primary photo thumbnail, kind, photo count and health
 * chips. The search, chips, sort and page live in the URL query so the
 * Photo health figures can link straight to a filtered list (L2-113).
 */
@Component({
  selector: 'sd-admin-places',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Banner,
    Empty,
    FilterChip,
    Filters,
    Icon,
    List,
    PageHeader,
    Pager,
    PlaceRow,
    Select,
    StatusRow,
    TextInput,
    Toolbar,
  ],
  templateUrl: './places.page.html',
  styleUrl: './places.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacesPage {
  private readonly places = inject(ADMIN_PLACES_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly view = this.places.list();
  protected readonly error = signal('');
  protected readonly kindChips = KIND_CHIPS;
  protected readonly flagChips = FLAG_CHIPS;
  protected readonly sourceChips = SOURCE_CHIPS;
  protected readonly sortOptions = SORT_OPTIONS;

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly sort = new FormControl<AdminPlacesQuery['sort']>('health', {
    nonNullable: true,
  });

  /** The query as the URL says it (the single source of truth). */
  protected readonly query = toSignal(
    this.route.queryParamMap.pipe(map((params) => parseAdminPlacesQuery((k) => params.get(k)))),
    { initialValue: DEFAULT_ADMIN_PLACES_QUERY },
  );

  /** The rows with their health chips as `sd-place-row` flags. */
  protected readonly rows = computed(() =>
    this.view().rows.map((row) => ({ ...row, chips: placeRowFlags(row.flags) })),
  );

  protected readonly countText = computed(() => {
    const v = this.view();
    return v.total === 1 ? '1 place' : `${v.total} places`;
  });

  constructor() {
    effect(() => {
      const q = this.query();
      this.search.setValue(q.q, { emitEvent: false });
      this.sort.setValue(q.sort, { emitEvent: false });
      void this.load(q);
    });
    // Scoped to the page: a debounced search must never fire after the
    // curator has already opened a place.
    this.search.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.apply({ q: q.trim(), page: 1 }));
    this.sort.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((sort) => this.apply({ sort, page: 1 }));
  }

  protected isActive(chip: FilterChipDef): boolean {
    return chip.active(this.query());
  }

  protected toggle(chip: FilterChipDef): void {
    this.apply({ ...chip.patch(this.query()), page: 1 });
  }

  protected goToPage(page: number): void {
    this.apply({ page });
  }

  private apply(patch: Partial<AdminPlacesQuery>): void {
    const next = toAdminPlacesParams({ ...this.query(), ...patch });
    const current = toAdminPlacesParams(this.query());
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: next });
  }

  private async load(query: AdminPlacesQuery): Promise<void> {
    this.error.set('');
    try {
      await this.places.load(query);
    } catch (err) {
      this.error.set('Could not load the places. Try again in a moment.');
      console.error('PlacesPage load failed', err);
    }
  }
}
