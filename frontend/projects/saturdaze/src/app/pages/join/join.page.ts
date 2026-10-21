import { NgTemplateOutlet } from '@angular/common';
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

import {
  AuthError,
  DayView,
  JoinPreview,
  SESSION_STORE,
  WeekendView,
  asWeekendDto,
  formatWeekendSpan,
  projectWeekend,
} from 'api';
import {
  AuthCard,
  Banner,
  Block,
  Button,
  Chip,
  Day,
  DayWeather,
  Disc,
  Icon,
  SkeletonRow,
  StatusRow,
  Strength,
  TextInput,
  Well,
} from 'components';

import { chipTone } from '../../shared/chip-tones';
import { devState } from '../../shared/dev-state';
import { passwordStrength } from '../../shared/password-strength';

/**
 * Join Saturdaze — `docs/mocks/pages/join.html` (L2-161). An administrator's
 * invite link opens `/join?token=…` under the site shell. With a sample
 * weekend the page shows the plan drafted for the family beside the
 * create-account card; without one, the card alone; a used, revoked or
 * expired link shows the invalid state.
 */

type JoinState = 'loading' | 'sample' | 'plain' | 'invalid';

const DAY_WEATHER: readonly DayWeather[] = ['sun', 'cloud', 'rain', 'snow'];

/** The gallery's `?state=plain` specimen. */
const SAMPLE_PREVIEW: JoinPreview = {
  email: 'priya@example.com',
  invitedByEmail: 'admin@saturdaze.ca',
  familyName: null,
  message: null,
  sample: null,
};

function matchPassword(c: AbstractControl): ValidationErrors | null {
  const password = c.get('password')?.value as string | undefined;
  const confirm = c.get('confirm')?.value as string | undefined;
  if (!password || !confirm) return null;
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    RouterLink,
    AuthCard,
    Banner,
    Block,
    Button,
    Chip,
    Day,
    Disc,
    Icon,
    SkeletonRow,
    StatusRow,
    Strength,
    TextInput,
    Well,
  ],
  templateUrl: './join.page.html',
  styleUrl: './join.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinPage {
  private readonly session = inject(SESSION_STORE);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly state = signal<JoinState>('loading');
  protected readonly preview = signal<JoinPreview | null>(null);
  protected readonly weekend = signal<WeekendView | null>(null);
  protected readonly submitting = signal(false);
  protected readonly error = signal('');
  protected readonly days = ['Saturday', 'Sunday'] as const;
  protected readonly skeleton = [0, 1, 2, 3] as const;
  protected readonly chipTone = chipTone;

  protected readonly familyName = computed(
    () => this.preview()?.familyName?.trim() || 'your family',
  );
  protected readonly heroTitle = computed(() => `A weekend planned for ${this.familyName()}`);
  protected readonly heroSubtitle = computed(() => {
    const p = this.preview();
    const by = p?.invitedByEmail
      ? `${p.invitedByEmail} invited you to Saturdaze.`
      : 'You are invited to Saturdaze.';
    const when = p?.sample
      ? ` Here is ${formatWeekendSpan(p.sample.weekendOf)},`
      : ' Here is a weekend,';
    return `${by}${when} drafted around your family, the forecast and the drive from home. Create your account and this plan is yours to keep, swap and share.`;
  });
  protected readonly plainSubtitle = computed(() => {
    const by = this.preview()?.invitedByEmail;
    return `${by ? `${by} invited you.` : 'You are invited.'} Choose a password to sign in with; your email is already confirmed by this link.`;
  });
  protected readonly submitLabel = computed(() =>
    this.state() === 'sample' ? 'Create my account' : 'Join Saturdaze',
  );

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
    if (dev === 'plain' || dev === 'invalid') {
      this.preview.set(dev === 'plain' ? SAMPLE_PREVIEW : null);
      this.state.set(dev);
      return;
    }
    void this.load();
  }

  protected dayWeather(day: DayView): DayWeather {
    const icon = day.weather.icon as DayWeather;
    return DAY_WEATHER.includes(icon) ? icon : 'cloud';
  }

  private async load(): Promise<void> {
    if (!this.token) {
      this.state.set('invalid');
      return;
    }
    try {
      const preview = await this.session.previewJoin(this.token);
      this.preview.set(preview);
      if (preview.sample) {
        this.weekend.set(projectWeekend(asWeekendDto(preview.sample), 'ready'));
        this.state.set('sample');
      } else {
        this.state.set('plain');
      }
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
      await this.session.acceptJoin({
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
