import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { WEEKEND_PLAN_SERVICE } from 'api';
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

interface SlotOption {
  readonly when: string;
  readonly subtitle: string;
  readonly fit: 'best' | 'ok' | 'tight';
}

const SLOT_OPTIONS: readonly SlotOption[] = [
  { when: 'Sunday 9:15am', subtitle: 'On the way back from church · 4 min off-route · adds 38m to the day', fit: 'best' },
  { when: 'Saturday 10:15am', subtitle: 'After swim · 12 min detour to Costco · adds 55m to Saturday', fit: 'ok' },
  { when: 'Friday 5:30pm', subtitle: "After work · doesn't touch the weekend · busier store", fit: 'ok' },
  { when: 'Saturday 4:00pm', subtitle: 'Between quiet time and workout · adds 70m · runs into dinner prep', fit: 'tight' },
];

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

  protected readonly slots = SLOT_OPTIONS;
  protected readonly showSlots = signal(false);
  protected readonly selectedSlot = signal(SLOT_OPTIONS[0]!);
  protected readonly submitting = signal(false);
  protected readonly added = signal(false);
  protected readonly error = signal('');

  protected readonly form = new FormGroup({
    description: new FormControl('Costco run — paper towels, bread, kid yogurt', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    duration: new FormControl('45', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d+$/)],
    }),
  });

  protected pickDifferentSlot(): void {
    this.showSlots.set(true);
  }

  protected selectSlot(slot: SlotOption): void {
    this.selectedSlot.set(slot);
  }

  protected async addToWeekend(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const raw = this.form.getRawValue();
      await this.weekend.addErrand(raw.description, Number(raw.duration));
      this.added.set(true);
    } catch {
      this.error.set("Couldn't add the errand. Try again in a minute.");
    } finally {
      this.submitting.set(false);
    }
  }

  protected backToWeekend(): void {
    void this.router.navigateByUrl('/weekend');
  }
}
