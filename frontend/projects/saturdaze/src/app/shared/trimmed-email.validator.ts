import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

/**
 * `Validators.email` that ignores surrounding whitespace, so a pasted
 * "name@example.com " validates and the pages' `.trim()` before submit
 * actually gets to run.
 */
export function trimmedEmail(control: AbstractControl<string | null>): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  return Validators.email({ value } as AbstractControl);
}
