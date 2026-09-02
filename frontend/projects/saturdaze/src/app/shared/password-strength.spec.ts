import { passwordStrength } from './password-strength';

describe('passwordStrength', () => {
  it('has no level for an empty password', () => {
    expect(passwordStrength('')).toEqual({ level: null, label: '' });
  });

  it('is weak under eight characters', () => {
    expect(passwordStrength('Abc123!')).toEqual({ level: 'weak', label: 'Weak · eight characters or more.' });
  });

  it('is OK from eight characters, nudging towards a capital', () => {
    expect(passwordStrength('password')).toEqual({
      level: 'ok',
      label: 'OK · eight characters or more. Add a capital letter to make it strong.',
    });
  });

  it('is strong at twelve or more characters with three character classes', () => {
    expect(passwordStrength('Lavender2026!')).toEqual({ level: 'strong', label: 'Strong.' });
    expect(passwordStrength('lavender2026!')).toEqual({ level: 'strong', label: 'Strong.' });
  });

  it('stays OK when long but with too few character classes, or short with many', () => {
    expect(passwordStrength('lavenderfieldsforever').level).toBe('ok');
    expect(passwordStrength('Lavender20').level).toBe('ok');
  });
});
