import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Onboarding progress (L2-166). Mirrors `.stepper` in
 * `docs/mocks/styles/app.css`: a "Step n of N" label and an `aria-hidden`
 * track of `count` segments, the ones before the current step `--done`
 * and the current one `--current`. The label is the accessible progress;
 * the track is decoration.
 */
@Component({
  selector: 'sd-stepper',
  standalone: true,
  templateUrl: './stepper.html',
  styleUrl: './stepper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'stepper',
    '[style.--sd-stepper-count]': 'count()',
  },
})
export class Stepper {
  /** The current step, 1-based. */
  readonly step = input<number>(1);
  /** How many steps the wizard has. */
  readonly count = input<number>(4);

  protected readonly label = computed(() => `Step ${this.step()} of ${this.count()}`);
  protected readonly segments = computed(() =>
    Array.from({ length: this.count() }, (_, i) => i + 1),
  );
}
