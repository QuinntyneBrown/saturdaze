import { chipTone, filterTone } from './chip-tones';

describe('chipTone', () => {
  it('maps the neutral api tone onto the plain chip', () => {
    expect(chipTone('neutral')).toBe('default');
  });

  it('passes every other tone through', () => {
    for (const tone of ['default', 'sun', 'sky', 'leaf', 'indoor', 'warn', 'accent', 'primary'] as const) {
      expect(chipTone(tone)).toBe(tone);
    }
  });
});

describe('filterTone', () => {
  it('keeps the tones a filter chip supports', () => {
    for (const tone of ['default', 'leaf', 'indoor', 'sky', 'sun', 'accent', 'primary'] as const) {
      expect(filterTone(tone)).toBe(tone);
    }
  });

  it('falls back to default for warn and neutral, which filter chips do not have', () => {
    expect(filterTone('warn')).toBe('default');
    expect(filterTone('neutral')).toBe('default');
  });
});
