import { AbstractControl, ValidationErrors } from '@angular/forms';

import { PasswordRule, StrengthLevel } from 'components';

export interface PasswordStrength {
  readonly level: StrengthLevel | null;
  readonly label: string;
}

/**
 * The three-step meter under password fields. Eight characters is the API's
 * minimum ("OK"); twelve or more with mixed character classes is "Strong".
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { level: null, label: '' };
  if (password.length < 8) return { level: 'weak', label: 'Weak · eight characters or more.' };
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length >= 12 && classes >= 3) return { level: 'strong', label: 'Strong.' };
  return {
    level: 'ok',
    label: 'OK · eight characters or more. Add a capital letter to make it strong.',
  };
}

/**
 * The rules the API enforces on every new password (L2-143): 8 or more
 * characters including a number or symbol (any non-letter).
 */
export function passwordRules(password: string): PasswordRule[] {
  return [
    { label: '8 or more characters', met: password.length >= 8 },
    { label: 'A number or symbol', met: /[^\p{L}]/u.test(password) },
  ];
}

/** Form validator twin of {@link passwordRules}: `{ passwordRules: true }` until every rule is met. */
export function meetsPasswordRules(control: AbstractControl<string>): ValidationErrors | null {
  return passwordRules(control.value ?? '').every((r) => r.met) ? null : { passwordRules: true };
}
