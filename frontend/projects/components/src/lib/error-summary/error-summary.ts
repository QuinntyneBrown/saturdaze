import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
} from '@angular/core';

/** One thing to fix: `id` names the field, `message` is the same sentence its field shows. */
export interface ErrorSummaryProblem {
  readonly id: string;
  readonly message: string;
}

const COUNT_WORDS: readonly string[] = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];

/**
 * Error summary shown above a form's first field after a failed submit
 * (L2-134). Mirrors `.error-summary` in docs/design-system. An alert that
 * takes focus (`focus()`); each line is a link that emits `problemSelected` with the
 * problem's id so the form can move focus to that field.
 */
@Component({
  selector: 'sd-error-summary',
  standalone: true,
  templateUrl: './error-summary.html',
  styleUrl: './error-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'error-summary',
    role: 'alert',
    tabindex: '-1',
    '[attr.aria-label]': 'title()',
  },
})
export class ErrorSummary {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly problems = input<readonly ErrorSummaryProblem[]>([]);
  /** A line was followed; the form focuses the field it names. */
  readonly problemSelected = output<string>();

  protected readonly title = computed(() => {
    const n = this.problems().length;
    return `${COUNT_WORDS[n] ?? n} ${n === 1 ? 'thing' : 'things'} to fix`;
  });

  focus(): void {
    this.host.nativeElement.focus();
  }

  protected follow(event: Event, id: string): void {
    event.preventDefault();
    this.problemSelected.emit(id);
  }
}
