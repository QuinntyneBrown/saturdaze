/**
 * "quinntynebrown@gmail.com" → "q••••••••••••n@gmail.com": the first and
 * last character of the local part survive, the rest become bullets (at
 * least three, so short names stay ambiguous).
 */
export function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at <= 0) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return `${local[0]}${'•'.repeat(3)}${domain}`;
  const bullets = '•'.repeat(Math.max(3, local.length - 2));
  return `${local[0]}${bullets}${local[local.length - 1]}${domain}`;
}
