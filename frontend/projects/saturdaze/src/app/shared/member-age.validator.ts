import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * A member's age: a whole number from 0 to 120 (L2-125 AC4, L2-215). An
 * empty value passes, so `Validators.required` owns that case.
 */
export function memberAge(
  control: AbstractControl<string | number | null>,
): ValidationErrors | null {
  const raw = control.value;
  if (raw === null || String(raw).trim() === '') return null;
  const age = Number(raw);
  return Number.isInteger(age) && age >= 0 && age <= 120 ? null : { memberAge: true };
}
