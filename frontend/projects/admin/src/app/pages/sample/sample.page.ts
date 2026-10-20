import { Dialog } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  ADMIN_INVITATIONS_SERVICE,
  BlockRow,
  DayView,
  ProspectView,
  WeekendView,
  formatWeekendSpan,
} from 'api';
import {
  Banner,
  Block,
  Button,
  Chip,
  Day,
  DayWeather,
  Empty,
  Icon,
  PageHeader,
  SkeletonRow,
} from 'components';

import { DIALOG_OPTIONS } from '../../dialogs/dialog-options';
import {
  InviteDialog,
  InviteDialogData,
  InviteDialogResult,
} from '../../dialogs/invite-dialog/invite-dialog';
import { chipTone } from '../../shared/chip-tones';
import { serverMessage } from '../../shared/server-errors';

type Status = 'loading' | 'ready' | 'missing';

const DAY_WEATHER: readonly DayWeather[] = ['sun', 'cloud', 'rain', 'snow'];

/** "1 locked" · "3 locked". */
export function lockedText(n: number): string {
  return `${n} locked`;
}

/**
 * Sample weekend (A10) — `docs/mocks/pages/admin.sample.html`: a prospect's
 * weekend shown like the family's own, with Swap and Lock on each block,
 * Regenerate in the header and "Send invite", which opens AD7 with this
 * sample preselected (L2-160).
 */
@Component({
  selector: 'sd-admin-sample',
  standalone: true,
  imports: [Banner, Block, Button, Chip, Day, Empty, Icon, PageHeader, SkeletonRow],
  templateUrl: './sample.page.html',
  styleUrl: './sample.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SamplePage {
  private readonly service = inject(ADMIN_INVITATIONS_SERVICE);
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(Dialog);

  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly status = signal<Status>('loading');
  protected readonly view = signal<ProspectView | null>(null);
  protected readonly weekend = signal<WeekendView | null>(null);
  protected readonly error = signal('');
  /** Block ids with a request in flight, so a double tap sends one request. */
  protected readonly busy = signal<ReadonlySet<string>>(new Set());
  protected readonly regenerating = signal(false);
  protected readonly days = ['Saturday', 'Sunday'] as const;
  protected readonly skeleton = [0, 1, 2, 3] as const;
  protected readonly chipTone = chipTone;

  protected readonly title = computed(() => {
    const v = this.view();
    return v ? `${v.prospect.familyName} · sample weekend` : 'Sample weekend';
  });
  protected readonly subtitle = computed(() => {
    const v = this.view();
    if (!v) return 'Opening the plan.';
    const parts = [formatWeekendSpan(v.prospect.weekendOf), v.membersText];
    if (v.prospect.homeLocation) parts.push(v.prospect.homeLocation.split(',')[0].trim());
    if (v.prospect.likes.length) parts.push(`likes ${v.prospect.likes.join(', ')}`);
    return `${parts.join(' · ')}. Swap or lock blocks, then send the invite.`;
  });
  protected readonly lockedCount = computed(
    () =>
      this.weekend()
        ?.days.flatMap((d) => d.blocks)
        .filter((b) => b.locked && b.lockable).length ?? 0,
  );
  protected readonly lockedLabel = computed(() => lockedText(this.lockedCount()));

  constructor() {
    void this.load();
  }

  protected dayWeather(day: DayView): DayWeather {
    const icon = day.weather.icon as DayWeather;
    return DAY_WEATHER.includes(icon) ? icon : 'cloud';
  }

  protected isBusy(block: BlockRow): boolean {
    return this.busy().has(block.id);
  }

  /** The next best pick for an unlocked activity (L2-160 AC5). */
  protected swap(block: BlockRow): Promise<void> {
    return this.act(block, () => this.service.swapBlock(this.id, block.id));
  }

  /** Lock or unlock a block (L2-160 AC5). */
  protected lock(block: BlockRow): Promise<void> {
    return this.act(block, () => this.service.lockBlock(this.id, block.id, !block.locked));
  }

  /** Re-plan everything that is not locked (L2-160 AC1). */
  protected async regenerate(): Promise<void> {
    if (this.regenerating()) return;
    this.regenerating.set(true);
    this.error.set('');
    try {
      this.weekend.set(await this.service.regenerate(this.id));
    } catch (err) {
      this.error.set(
        serverMessage(err) || 'The weekend did not regenerate. Try again in a moment.',
      );
      console.error('SamplePage regenerate failed', err);
    } finally {
      this.regenerating.set(false);
    }
  }

  /** AD7 with this sample preselected; the prospect reads back as Invited (L2-160 AC6). */
  protected async sendInvite(): Promise<void> {
    const v = this.view();
    if (!v) return;
    const ref = this.dialog.open<InviteDialogResult, InviteDialogData>(InviteDialog, {
      ...DIALOG_OPTIONS,
      data: {
        prospects: [v.row],
        prospectId: v.prospect.id,
        send: (request) => this.service.send(request),
      },
    });
    const rows = await firstValueFrom(ref.closed);
    if (!rows?.length) return;
    await this.load();
  }

  private async act(block: BlockRow, work: () => Promise<WeekendView>): Promise<void> {
    if (this.isBusy(block)) return;
    this.error.set('');
    this.busy.update((b) => new Set(b).add(block.id));
    try {
      this.weekend.set(await work());
    } catch (err) {
      this.error.set(serverMessage(err) || 'That change did not save. Try again in a moment.');
      console.error('SamplePage block action failed', err);
    } finally {
      this.busy.update((b) => {
        const next = new Set(b);
        next.delete(block.id);
        return next;
      });
    }
  }

  private async load(): Promise<void> {
    try {
      const view = await this.service.prospect(this.id);
      this.view.set(view);
      this.weekend.set(view.weekend);
      this.status.set('ready');
    } catch (err) {
      console.error('SamplePage load failed', err);
      this.status.set('missing');
    }
  }
}
