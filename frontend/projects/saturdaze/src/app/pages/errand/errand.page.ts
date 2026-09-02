import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { WEEKEND_PLAN_SERVICE, type WeekendDay } from 'api';
import {
  BottomNav,
  Button,
  Card,
  Chip,
  Icon,
  TagGroup,
  TextInput,
  TopBar,
} from 'components';

/** A "Best day" chip: a preferred day, or let the planner decide. */
interface DayChoice {
  readonly label: string;
  readonly value: WeekendDay | null;
}

const DAY_CHOICES: readonly DayChoice[] = [
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' },
  { label: "Doesn't matter", value: null },
];

/** How long the confirmation card shows before returning to the weekend. */
export const ERRAND_REDIRECT_MS = 1600;

@Component({
  selector: 'app-errand',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    BottomNav,
    Button,
    Card,
    Chip,
    Icon,
    TagGroup,
    TextInput,
    TopBar,
  ],
  templateUrl: './errand.page.html',
  styleUrl: './errand.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrandPage {
  private readonly weekend = inject(WEEKEND_PLAN_SERVICE);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private redirectTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly dayChoices = DAY_CHOICES;
  protected readonly preferredDay = signal<WeekendDay | null>(null);
  protected readonly placement = this.weekend.lastErrandPlacement();
  protected readonly submitting = signal(false);
  protected readonly added = signal(false);
  protected readonly error = signal('');

  protected readonly form = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    duration: new FormControl('45', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d+$/)],
    }),
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearRedirect());
  }

  protected choosePreferredDay(value: WeekendDay | null): void {
    this.preferredDay.set(value);
  }

  /** The planner picks the slot; the confirmation shows where it landed (L2-021 AC2). */
  protected async addToWeekend(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const raw = this.form.getRawValue();
      await this.weekend.addErrand(raw.description.trim(), Number(raw.duration), this.preferredDay());
      this.added.set(true);
      this.redirectTimer = setTimeout(() => this.backToWeekend(), ERRAND_REDIRECT_MS);
    } catch {
      this.error.set("Couldn't add the errand. Try again in a minute.");
    } finally {
      this.submitting.set(false);
    }
  }

  protected backToWeekend(): void {
    this.clearRedirect();
    void this.router.navigateByUrl('/weekend');
  }

  private clearRedirect(): void {
    if (this.redirectTimer !== null) {
      clearTimeout(this.redirectTimer);
      this.redirectTimer = null;
    }
  }
}
