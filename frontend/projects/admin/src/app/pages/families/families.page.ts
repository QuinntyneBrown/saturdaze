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

import {
  ADMIN_FAMILIES_SERVICE,
  AdminFamiliesQuery,
  DEFAULT_ADMIN_FAMILIES_QUERY,
  parseAdminFamiliesQuery,
  toAdminFamiliesParams,
} from 'api';
import {
  Avatar,
  Banner,
  Chip,
  Empty,
  Icon,
  List,
  ListItem,
  PageHeader,
  Pager,
  StatusRow,
  TextInput,
  Toolbar,
} from 'components';

import { chipTone } from '../../shared/chip-tones';

/**
 * Families (A8) — `docs/mocks/pages/admin.families.html`: every family with
 * who signs in for it and whether the upcoming weekend is planned (L2-157).
 * The search and page live in the URL query so a list can be shared.
 */
@Component({
  selector: 'sd-admin-families',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Avatar,
    Banner,
    Chip,
    Empty,
    Icon,
    List,
    ListItem,
    PageHeader,
    Pager,
    StatusRow,
    TextInput,
    Toolbar,
  ],
  templateUrl: './families.page.html',
  styleUrl: './families.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FamiliesPage {
  private readonly families = inject(ADMIN_FAMILIES_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly view = this.families.list();
  protected readonly error = signal('');
  protected readonly chipTone = chipTone;
  protected readonly search = new FormControl('', { nonNullable: true });

  /** The query as the URL says it (the single source of truth). */
  protected readonly query = toSignal(
    this.route.queryParamMap.pipe(map((params) => parseAdminFamiliesQuery((k) => params.get(k)))),
    { initialValue: DEFAULT_ADMIN_FAMILIES_QUERY },
  );

  protected readonly countText = computed(() => {
    const v = this.view();
    return v.total === 1 ? '1 family' : `${v.total} families`;
  });

  constructor() {
    effect(() => {
      const q = this.query();
      this.search.setValue(q.q, { emitEvent: false });
      void this.load(q);
    });
    this.search.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.apply({ q: q.trim(), page: 1 }));
  }

  protected goToPage(page: number): void {
    this.apply({ page });
  }

  private apply(patch: Partial<AdminFamiliesQuery>): void {
    const next = toAdminFamiliesParams({ ...this.query(), ...patch });
    if (JSON.stringify(next) === JSON.stringify(toAdminFamiliesParams(this.query()))) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: next });
  }

  private async load(query: AdminFamiliesQuery): Promise<void> {
    this.error.set('');
    try {
      await this.families.load(query);
    } catch (err) {
      this.error.set('Could not load the families. Try again in a moment.');
      console.error('FamiliesPage load failed', err);
    }
  }
}
