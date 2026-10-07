import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthError, Invitation, SESSION_STORE } from 'api';
import {
  AuthCard,
  AuthShell,
  Banner,
  Button,
  Disc,
  StatusRow,
  Strength,
  TextInput,
} from 'components';

import { devState } from '../../shared/dev-state';
import { passwordStrength } from '../../shared/password-strength';

/**
 * Accept invite — `docs/mocks/pages/accept-invite.html` (L2-127). The owner
 * shares `/accept-invite?token=…`; the page previews the invitation, then
 * the invitee chooses a password and joins the family signed in. A used,
 * removed or expired invite shows the invalid state.
 */

type AcceptState = 'loading' | 'join' | 'invalid';

/** The gallery's `?state=join` specimen. */
const SAMPLE: Invitation = {
  familyName: 'The Browns',
  email: 'sara@example.com',
  invitedByEmail: 'quinntynebrown@gmail.com',
};

function matchPassword(c: AbstractControl): ValidationErrors | null {
  const password = c.get('password')?.value as string | undefined;
  const confirm = c.get('confirm')?.value as string | undefined;
  if (!password || !confirm) return null;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthShell,
    AuthCard,
    Banner,
    Button,
    Disc,
    StatusRow,
    Strength,
    TextInput,
  ],
  templateUrl: './accept-invite.page.html',
  styleUrl: './accept-invite.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptInvitePage {
  private readonly session = inject(SESSION_STORE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly state = signal<AcceptState>('loading');
  protected readonly invitation = signal<Invitation | null>(null);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');

  protected readonly title = computed(
    () => `Join ${this.invitation()?.familyName?.trim() || 'your family'} on Saturdaze`,
  );
  protected readonly subtitle = computed(() => {
    const by = this.invitation()?.invitedByEmail;
    return `${by ? `${by} invited you.` : 'You are invited.'} Choose a password to sign in with your own account.`;
  });

  protected readonly form = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: matchPassword },
  );

  private readonly password = toSignal(this.form.controls.password.valueChanges, {
    initialValue: '',
  });
  protected readonly strength = computed(() => passwordStrength(this.password()));

  constructor() {
    const dev = devState(this.route);
    if (dev === 'join' || dev === 'invalid') {
      this.invitation.set(dev === 'join' ? SAMPLE : null);
      this.state.set(dev);
      return;
    }
    void this.preview();
  }

  private async preview(): Promise<void> {
    if (!this.token) {
      this.state.set('invalid');
      return;
    }
    try {
      this.invitation.set(await this.session.previewInvitation(this.token));
      this.state.set('join');
    } catch {
      this.state.set('invalid');
    }
  }

  protected async join(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      this.error.set(
        this.form.hasError('mismatch')
          ? 'Those passwords do not match.'
          : 'Choose a password of eight characters or more.',
      );
      return;
    }
    this.submitting.set(true);
    this.error.set('');
    try {
      await this.session.acceptInvitation({
        token: this.token,
        password: this.form.controls.password.value,
      });
      await this.router.navigateByUrl('/weekend');
    } catch (e) {
      const error = e as AuthError;
      if (error.code === 'token_expired' || error.code === 'token_invalid') {
        this.state.set('invalid');
      } else {
        this.error.set(error.message || 'Could not join just now. Try again in a moment.');
      }
    } finally {
      this.submitting.set(false);
    }
  }
}
