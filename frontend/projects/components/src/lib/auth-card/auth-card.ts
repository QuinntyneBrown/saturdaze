import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Bordered, padded card used inside `sd-auth-shell` to hold the auth form.
 *
 * Mirrors the `.auth-card` block in `docs/mocks/pages/login.html`.
 */
@Component({
  selector: 'sd-auth-card',
  standalone: true,
  templateUrl: './auth-card.html',
  styleUrl: './auth-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCard {}
