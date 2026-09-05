import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Router } from '@angular/router';

import { Icon } from '../icon/icon';
import { navigateInApp } from '../shared/in-app-link';

/**
 * Dashed "add" affordance under a list ("Add an errand", "Add a family
 * member"). Mirrors `.ghost-row`. Renders a `<button>` (emits `pressed`) or,
 * with `href`, an in-app `<a>`. The host adds no box.
 */
@Component({
  selector: 'sd-ghost-row',
  standalone: true,
  imports: [Icon, NgTemplateOutlet],
  templateUrl: './ghost-row.html',
  styleUrl: './ghost-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.icon]': 'icon()',
    '[attr.href]': 'href() || null',
  },
})
export class GhostRow {
  private readonly router = inject(Router, { optional: true });

  readonly icon = input<string>('plus');
  readonly href = input<string>('');
  readonly pressed = output<void>();

  protected onAnchorClick(event: MouseEvent): void {
    if (this.router) navigateInApp(this.router, event, this.href());
  }
}
