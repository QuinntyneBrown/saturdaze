import { Dialog } from '@angular/cdk/dialog';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, filter, firstValueFrom, map, switchMap } from 'rxjs';

import {
  ADMIN_EMAIL_TEMPLATES_SERVICE,
  BUILT_IN_PLACEHOLDERS,
  ChipView,
  EmailPreviewDto,
  EmailTemplateStatus,
  EmailTemplateView,
  SaveEmailTemplateRequest,
  templatePlaceholders,
} from 'api';
import {
  Banner,
  Button,
  Chip,
  EmailPreview,
  Empty,
  Icon,
  PageHeader,
  StatusRow,
  TextInput,
} from 'components';

import {
  DeleteTemplateDialog,
  DeleteTemplateDialogData,
  DeleteTemplateDialogResult,
} from '../../dialogs/delete-template-dialog/delete-template-dialog';
import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
import {
  NewTemplateDialog,
  NewTemplateDialogData,
  NewTemplateDialogResult,
} from '../../dialogs/new-template-dialog/new-template-dialog';
import { chipTone } from '../../shared/chip-tones';
import { errorCode, templateErrorMessage } from '../../shared/template-errors';

type Status = 'loading' | 'ready' | 'missing';

/** The editable content of a template, as the form holds it. */
type Content = Omit<SaveEmailTemplateRequest, 'version'>;

const UNSAVED: ChipView = { tone: 'sun', label: 'Unsaved changes' };

/** The status action each status offers (L2-129 AC5); a system template offers none. */
const STATUS_ACTION: Record<
  EmailTemplateStatus,
  { readonly label: string; readonly icon: string; readonly to: EmailTemplateStatus }
> = {
  Draft: { label: 'Activate', icon: 'sparkle', to: 'Active' },
  Active: { label: 'Archive', icon: 'lock', to: 'Archived' },
  Archived: { label: 'Restore as draft', icon: 'unlock', to: 'Draft' },
};

/**
 * Email template editor (A9) — `docs/mocks/pages/admin.email.html`: the
 * header (name, key, category, version, last change, status and system
 * chips, actions), the system-template note, and the content form: name,
 * description, subject, preheader, HTML and plain-text bodies, and a
 * sample value for each placeholder the content uses (built-ins excepted).
 * "Save changes" stays disabled until something changed; a stale copy
 * says so and offers a reload (L2-127). Beside the form, `sd-email-preview`
 * renders the unsaved content 300 ms after the last edit (L2-128).
 * Activate, Archive and Restore as draft follow the status; Delete opens
 * AD8; a system template offers neither (L2-129). Duplicate opens AD7
 * (L2-126).
 */
@Component({
  selector: 'sd-admin-email-template',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Banner,
    Button,
    Chip,
    EmailPreview,
    Empty,
    Icon,
    PageHeader,
    StatusRow,
    TextInput,
  ],
  templateUrl: './email-template.page.html',
  styleUrl: './email-template.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplatePage {
  private readonly templates = inject(ADMIN_EMAIL_TEMPLATES_SERVICE);
  private readonly dialog = inject(Dialog);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id') ?? '')), {
    initialValue: '',
  });

  protected readonly status = signal<Status>('loading');
  protected readonly view = signal<EmailTemplateView | null>(null);
  protected readonly error = signal('');
  protected readonly stale = signal(false);
  protected readonly saving = signal(false);
  protected readonly preview = signal<EmailPreviewDto | null>(null);
  protected readonly previewError = signal('');
  protected readonly tone = chipTone;

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    subject: new FormControl('', { nonNullable: true }),
    preheader: new FormControl('', { nonNullable: true }),
    htmlBody: new FormControl('', { nonNullable: true }),
    textBody: new FormControl('', { nonNullable: true }),
    samples: new FormRecord<FormControl<string>>({}),
  });

  private readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  /** The content as last loaded or saved; the form is dirty when it differs. */
  private readonly baseline = signal('');

  /** Placeholders the content uses that need a sample value (built-ins have their own). */
  protected readonly samplePlaceholders = computed(() => {
    const v = this.value();
    return templatePlaceholders(
      v.subject ?? '',
      v.preheader ?? '',
      v.htmlBody ?? '',
      v.textBody ?? '',
    ).filter((name) => !BUILT_IN_PLACEHOLDERS.includes(name));
  });

  protected readonly content = computed<Content>(() => {
    const v = this.value();
    const samples = (v.samples ?? {}) as Record<string, string>;
    const sampleData: Record<string, string> = {};
    for (const name of this.samplePlaceholders()) {
      const value = (samples[name] ?? '').trim();
      if (value) sampleData[name] = value;
    }
    return {
      name: (v.name ?? '').trim(),
      description: (v.description ?? '').trim(),
      subject: (v.subject ?? '').trim(),
      preheader: (v.preheader ?? '').trim(),
      htmlBody: v.htmlBody ?? '',
      textBody: v.textBody ?? '',
      sampleData,
    };
  });

  protected readonly dirty = computed(() => JSON.stringify(this.content()) !== this.baseline());
  protected readonly canSave = computed(() => this.dirty() && !this.saving());

  protected readonly chips = computed(() => {
    const chips = [...(this.view()?.chips ?? [])];
    if (this.dirty()) chips.push(UNSAVED);
    return chips;
  });

  /** Activate, Archive or Restore as draft; none for a system template (L2-129 AC6). */
  protected readonly statusAction = computed(() => {
    const v = this.view();
    return v && !v.isSystem ? STATUS_ACTION[v.status] : null;
  });

  protected readonly busy = signal(false);

  /** Why a template keeps certain placeholders (a system link, a marketing unsubscribe). */
  protected readonly note = computed(() => {
    const v = this.view();
    if (!v?.requiredPlaceholders.length) return '';
    const names = v.requiredPlaceholders.map((p) => `{{${p}}}`).join(' and ');
    return v.isSystem
      ? `A system template: Saturdaze sends it from the account flows. It stays active, and both bodies keep ${names}.`
      : `Marketing templates keep ${names} in both bodies so every recipient can opt out.`;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) void this.load(id);
    });
    // The preview follows the content, 300 ms after the last edit; a refusal keeps the last render.
    toObservable(this.content)
      .pipe(
        filter(() => this.view() !== null),
        map((c) => ({
          subject: c.subject,
          preheader: c.preheader,
          htmlBody: c.htmlBody,
          textBody: c.textBody,
          sampleData: c.sampleData,
        })),
        distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
        debounceTime(300),
        switchMap(async (request) => {
          try {
            return { preview: await this.templates.preview(request), error: '' };
          } catch (err) {
            return { preview: null, error: templateErrorMessage(err) };
          }
        }),
        takeUntilDestroyed(),
      )
      .subscribe(({ preview, error }) => {
        if (preview) this.preview.set(preview);
        this.previewError.set(error);
      });
    // Each placeholder the content starts using gets a sample field; values already typed stay.
    effect(() => {
      const samples = this.form.controls.samples;
      const known = this.view()?.sampleData ?? {};
      for (const name of this.samplePlaceholders()) {
        if (!samples.contains(name)) {
          samples.addControl(name, new FormControl(known[name] ?? '', { nonNullable: true }));
        }
      }
    });
  }

  /** Saves the content at the version it was loaded at (L2-127). */
  protected async save(): Promise<void> {
    const v = this.view();
    if (!v || !this.canSave()) return;
    this.saving.set(true);
    this.error.set('');
    this.stale.set(false);
    try {
      this.show(await this.templates.save(v.id, { ...this.content(), version: v.version }));
    } catch (err) {
      if (errorCode(err) === 'template_stale') this.stale.set(true);
      else this.error.set(templateErrorMessage(err));
    } finally {
      this.saving.set(false);
    }
  }

  /**
   * Moves the saved template to its next status. The form keeps any unsaved edits: a status
   * change does not touch the content, so the baseline stays as it was.
   */
  protected async changeStatus(to: EmailTemplateStatus): Promise<void> {
    const v = this.view();
    if (!v || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.stale.set(false);
    try {
      this.view.set(await this.templates.setStatus(v.id, to, v.version));
    } catch (err) {
      if (errorCode(err) === 'template_stale') this.stale.set(true);
      else this.error.set(templateErrorMessage(err));
    } finally {
      this.busy.set(false);
    }
  }

  /** AD8, then the delete and back to the list (L2-129 AC7). */
  protected async remove(): Promise<void> {
    const v = this.view();
    if (!v || v.isSystem) return;
    const ref = this.dialog.open<DeleteTemplateDialogResult, DeleteTemplateDialogData>(
      DeleteTemplateDialog,
      {
        ...DIALOG_OPTIONS,
        role: 'alertdialog',
        data: { name: v.name, key: v.key, versions: v.version },
      },
    );
    if ((await firstValueFrom(ref.closed)) !== 'delete') return;
    this.error.set('');
    try {
      await this.templates.remove(v.id);
      await this.router.navigateByUrl('/email-templates');
    } catch (err) {
      this.error.set(templateErrorMessage(err));
    }
  }

  /** Throws away the stale copy and loads what is saved now. */
  protected async reload(): Promise<void> {
    const id = this.id();
    if (id) await this.load(id);
  }

  /** AD7 in duplicate mode: a new draft with this template's content (L2-126 AC3). */
  protected async duplicate(): Promise<void> {
    const v = this.view();
    if (!v) return;
    const ref = this.dialog.open<NewTemplateDialogResult, NewTemplateDialogData>(
      NewTemplateDialog,
      {
        ...DIALOG_OPTIONS,
        data: {
          source: { id: v.id, name: v.name, category: v.category },
          create: async (request) => (await this.templates.create(request)).id,
        },
      },
    );
    const id = await firstValueFrom(ref.closed);
    if (id) await this.router.navigate(['/email-templates', id]);
  }

  /** Puts a template in the header and the form, and makes it the clean baseline. */
  private show(template: EmailTemplateView): void {
    this.view.set(template);
    const samples = this.form.controls.samples;
    for (const name of Object.keys(samples.controls))
      samples.removeControl(name, { emitEvent: false });
    for (const [name, value] of Object.entries(template.sampleData)) {
      samples.addControl(name, new FormControl(value, { nonNullable: true }), { emitEvent: false });
    }
    this.form.patchValue({
      name: template.name,
      description: template.description,
      subject: template.subject,
      preheader: template.preheader,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
    });
    this.baseline.set(JSON.stringify(this.content()));
  }

  private async load(id: string): Promise<void> {
    this.status.set('loading');
    this.error.set('');
    this.stale.set(false);
    try {
      this.show(await this.templates.get(id));
      this.status.set('ready');
    } catch (err) {
      const status = (err as { status?: number }).status;
      if (status === 404 || status === 400) {
        this.status.set('missing');
        return;
      }
      this.status.set('ready');
      this.error.set('Could not load this template. Try again in a moment.');
      console.error('EmailTemplatePage load failed', err);
    }
  }
}
