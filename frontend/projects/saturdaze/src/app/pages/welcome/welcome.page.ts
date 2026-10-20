import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

import { EditableFamilyProfile, FAMILY_SERVICE, SESSION_STORE } from 'api';
import { AuthCard, AuthShell, Banner, Button, Icon, Stepper, TextInput } from 'components';

import { environment } from '../../../environments/environment';

/**
 * Welcome — `docs/mocks/pages/welcome.html`, the onboarding wizard a new
 * account lands in (L1-038). One route per step, `/welcome/:step`: home,
 * family, likes, preferences and done. Every step saves as it is
 * completed through the family profile; Skip moves on without saving.
 */

export type WizardStep = 'home' | 'family' | 'likes' | 'preferences' | 'done';

export const WIZARD_STEPS: readonly WizardStep[] = [
  'home',
  'family',
  'likes',
  'preferences',
  'done',
];

/** The steps the stepper counts: everything but the closing screen. */
const COUNTED_STEPS = WIZARD_STEPS.length - 1;

const SAVE_FAILED = 'That did not save. Try again in a moment.';

function isWizardStep(value: string | null): value is WizardStep {
  return (WIZARD_STEPS as readonly string[]).includes(value ?? '');
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    AuthShell,
    AuthCard,
    Banner,
    Button,
    Icon,
    Stepper,
    TextInput,
  ],
  templateUrl: './welcome.page.html',
  styleUrl: './welcome.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomePage {
  /** Where the brand and "Back to Saturdaze" lead: the marketing site (ADR-018). */
  protected readonly siteUrl = environment.siteUrl;
  private readonly familyService = inject(FAMILY_SERVICE);
  protected readonly session = inject(SESSION_STORE);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly requestedStep = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('step'))),
    { initialValue: this.route.snapshot.paramMap.get('step') },
  );
  /** The step on screen; an unknown `:step` is sent back to `home`. */
  protected readonly step = computed<WizardStep>(() => {
    const requested = this.requestedStep();
    return isWizardStep(requested) ? requested : 'home';
  });
  protected readonly stepNumber = computed(() => WIZARD_STEPS.indexOf(this.step()) + 1);
  protected readonly stepCount = COUNTED_STEPS;
  protected readonly isFirst = computed(() => this.stepNumber() === 1);

  protected readonly view = this.familyService.getFamily();
  private readonly editable = this.familyService.getEditableProfile();

  protected readonly home = signal('');
  protected readonly canContinueHome = computed(() => this.home().trim().length > 0);

  protected readonly saving = signal(false);
  protected readonly error = signal('');

  private seeded = false;

  constructor() {
    void this.familyService.load();
    // Each step's local state starts from the stored profile, once it has loaded.
    effect(() => {
      const profile = this.editable();
      if (!profile || this.seeded) return;
      this.seeded = true;
      this.seedFrom(profile);
    });
    effect(() => {
      if (!isWizardStep(this.requestedStep())) {
        void this.router.navigate(['/welcome', 'home'], { replaceUrl: true });
      }
    });
  }

  private seedFrom(profile: EditableFamilyProfile): void {
    this.home.set(profile.homeLocation);
  }

  // ---- navigation -----------------------------------------------------

  protected submit(event?: Event): Promise<void> {
    event?.preventDefault();
    return this.continueStep();
  }

  protected async continueStep(): Promise<void> {
    if (this.saving()) return;
    switch (this.step()) {
      case 'home':
        if (!this.canContinueHome()) return;
        if (!(await this.save((p) => ({ ...p, homeLocation: this.home().trim() })))) return;
        break;
      default:
        break;
    }
    await this.goTo(this.stepNumber() + 1);
  }

  protected skip(): Promise<boolean> {
    return this.goTo(this.stepNumber() + 1);
  }

  protected back(): Promise<boolean> {
    return this.goTo(this.stepNumber() - 1);
  }

  private goTo(number: number): Promise<boolean> {
    const next = WIZARD_STEPS[Math.min(Math.max(number, 1), WIZARD_STEPS.length) - 1];
    return this.router.navigate(['/welcome', next]);
  }

  // ---- saving ---------------------------------------------------------

  /** Saves the editable profile with `mutate` applied; `false` when it did not save. */
  private async save(
    mutate: (profile: EditableFamilyProfile) => EditableFamilyProfile,
  ): Promise<boolean> {
    const current = this.editable();
    if (!current) return false;
    this.saving.set(true);
    this.error.set('');
    try {
      await this.familyService.saveProfile(mutate(current));
      return true;
    } catch (err) {
      this.error.set(SAVE_FAILED);
      console.error('WelcomePage save failed', err);
      return false;
    } finally {
      this.saving.set(false);
    }
  }
}
