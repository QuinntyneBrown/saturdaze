import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Button } from '../button/button';
import { Scrolled } from '../scrolled/scrolled';

/**
 * The lighter bar on public pages (legal, a shared weekend): wordmark left,
 * "Sign in" and an optional "Create your account" CTA right. The wordmark
 * leads to `homeHref`: the app root by default, the marketing site when the
 * family app passes its site URL (ADR-018).
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
    '[class.sitebar--cta]': 'cta()',
  },
})
export class Sitebar {
  readonly cta = input(false, { transform: booleanAttribute });
  /** Where the wordmark leads; a plain href, so it may be another origin. */
  readonly homeHref = input('/');
}
