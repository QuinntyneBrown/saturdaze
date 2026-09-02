import { StrengthLevel } from 'components';

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
