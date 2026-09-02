import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '../button/button';
import { Scrolled } from '../scrolled/scrolled';

/**
 * The lighter bar on public pages (landing, legal, a shared weekend):
 * wordmark left, "Sign in" and an optional "Create your account" CTA right.
 * Mirrors `.sitebar` in docs/mocks-v2/styles/app.css. Shown at every width.
 */
@Component({
  selector: 'sd-sitebar',
  standalone: true,
  imports: [Button, RouterLink],
  hostDirectives: [Scrolled],
  templateUrl: './sitebar.html',
  styleUrl: './sitebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sitebar',
    '[attr.cta]': 'cta() ? "" : null',
  },
})
export class Sitebar {
  readonly cta = input(false, { transform: booleanAttribute });
}
