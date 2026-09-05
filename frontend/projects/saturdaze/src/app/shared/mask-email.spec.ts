import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it('keeps the first and last character of the local part', () => {
    expect(maskEmail('quinntynebrown@gmail.com')).toBe('q••••••••••••n@gmail.com');
  });

  it('uses at least three bullets so short names stay ambiguous', () => {
    expect(maskEmail('abc@x.com')).toBe('a•••c@x.com');
    expect(maskEmail('abcd@x.com')).toBe('a•••d@x.com');
  });

  it('shows only the first character of a one- or two-character local part', () => {
    expect(maskEmail('ab@x.com')).toBe('a•••@x.com');
    expect(maskEmail('a@x.com')).toBe('a•••@x.com');
  });

  it('returns anything that is not an address untouched', () => {
    expect(maskEmail('not-an-email')).toBe('not-an-email');
    expect(maskEmail('@x.com')).toBe('@x.com');
    expect(maskEmail('')).toBe('');
  });
});
