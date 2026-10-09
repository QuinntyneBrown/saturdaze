import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';

import { ADMIN_EMAIL_TEMPLATES_SERVICE, EmailTemplateView } from 'api';
import { Banner, Button, Chip, Empty, Icon, PageHeader, StatusRow } from 'components';

import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
import {
  NewTemplateDialog,
  NewTemplateDialogData,
  NewTemplateDialogResult,
} from '../../dialogs/new-template-dialog/new-template-dialog';
import { chipTone } from '../../shared/chip-tones';

type Status = 'loading' | 'ready' | 'missing';

/**
 * Email template editor (A9) — `docs/mocks/pages/admin.email.html`: one
 * template's header (name, key, category, version, last change, status and
 * system chips) and its actions. Duplicate opens AD7 with the category
 * fixed (L2-126).
 */
@Component({
  selector: 'sd-admin-email-template',
  standalone: true,
  imports: [Banner, Button, Chip, Empty, Icon, PageHeader, StatusRow],
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
  protected readonly tone = chipTone;

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) void this.load(id);
    });
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

  private async load(id: string): Promise<void> {
    this.status.set('loading');
    this.error.set('');
    try {
      this.view.set(await this.templates.get(id));
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
