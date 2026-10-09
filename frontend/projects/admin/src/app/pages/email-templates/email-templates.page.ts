import { Dialog } from '@angular/cdk/dialog';
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
import { debounceTime, distinctUntilChanged, firstValueFrom, map } from 'rxjs';

import {
  ADMIN_EMAIL_TEMPLATES_SERVICE,
  DEFAULT_EMAIL_TEMPLATES_QUERY,
  EMAIL_TEMPLATE_CATEGORIES,
  EMAIL_TEMPLATE_STATUSES,
  EmailTemplateCategory,
  EmailTemplateRow,
  EmailTemplateStatus,
  EmailTemplatesQuery,
  parseEmailTemplatesQuery,
  toEmailTemplatesParams,
} from 'api';
import {
  Banner,
  Button,
  Chip,
  Empty,
  Icon,
  List,
  ListItem,
  PageHeader,
  Select,
  SelectOption,
  StatusRow,
  TextInput,
  Toolbar,
} from 'components';

import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
import {
  NewTemplateDialog,
  NewTemplateDialogData,
  NewTemplateDialogResult,
} from '../../dialogs/new-template-dialog/new-template-dialog';
import { chipTone } from '../../shared/chip-tones';

type Status = 'loading' | 'ready';

const CATEGORY_OPTIONS: readonly SelectOption[] = [
  { value: '', label: 'All categories' },
  ...EMAIL_TEMPLATE_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
];

const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: '', label: 'All statuses' },
  ...EMAIL_TEMPLATE_STATUSES.map((s) => ({ value: s, label: s })),
];

/**
 * Email templates (A8) — `docs/mocks/pages/admin.emails.html`: every
 * template as a row with its key, category, status and system chips and
 * its last change. The search and both selects live in the URL query
 * (L2-131). New template opens AD7 (L2-132).
 */
@Component({
  selector: 'sd-admin-email-templates',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Banner,
    Button,
    Chip,
    Empty,
    Icon,
    List,
    ListItem,
    PageHeader,
    Select,
    StatusRow,
    TextInput,
    Toolbar,
  ],
  templateUrl: './email-templates.page.html',
  styleUrl: './email-templates.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplatesPage {
  private readonly templates = inject(ADMIN_EMAIL_TEMPLATES_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(Dialog);

  protected readonly status = signal<Status>('loading');
  protected readonly rows = signal<EmailTemplateRow[]>([]);
  protected readonly error = signal('');
  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly tone = chipTone;

  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly category = new FormControl('', { nonNullable: true });
  protected readonly statusFilter = new FormControl('', { nonNullable: true });

  /** The filters as the URL says them (the single source of truth). */
  protected readonly query = toSignal(
    this.route.queryParamMap.pipe(map((p) => parseEmailTemplatesQuery((k) => p.get(k)))),
    { initialValue: DEFAULT_EMAIL_TEMPLATES_QUERY },
  );

  protected readonly countText = computed(() => {
    const n = this.rows().length;
    return n === 1 ? '1 template' : `${n} templates`;
  });

  constructor() {
    effect(() => {
      const q = this.query();
      this.search.setValue(q.q, { emitEvent: false });
      this.category.setValue(q.category ?? '', { emitEvent: false });
      this.statusFilter.setValue(q.status ?? '', { emitEvent: false });
      void this.load(q);
    });
    this.search.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((q) => this.apply({ q: q.trim() }));
    this.category.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((c) => this.apply({ category: (c || null) as EmailTemplateCategory | null }));
    this.statusFilter.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((s) => this.apply({ status: (s || null) as EmailTemplateStatus | null }));
  }

  /** AD7: a new draft from the category's starter, then its editor (L2-132). */
  protected async newTemplate(): Promise<void> {
    const ref = this.dialog.open<NewTemplateDialogResult, NewTemplateDialogData>(
      NewTemplateDialog,
      {
        ...DIALOG_OPTIONS,
        data: { create: async (request) => (await this.templates.create(request)).id },
      },
    );
    const id = await firstValueFrom(ref.closed);
    if (id) await this.router.navigate(['/email-templates', id]);
  }

  private apply(patch: Partial<EmailTemplatesQuery>): void {
    const next = toEmailTemplatesParams({ ...this.query(), ...patch });
    if (JSON.stringify(next) === JSON.stringify(toEmailTemplatesParams(this.query()))) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: next });
  }

  private async load(query: EmailTemplatesQuery): Promise<void> {
    this.error.set('');
    try {
      this.rows.set(await this.templates.list(query));
    } catch (err) {
      this.rows.set([]);
      this.error.set('Could not load the templates. Try again in a moment.');
      console.error('EmailTemplatesPage load failed', err);
    } finally {
      this.status.set('ready');
    }
  }
}
