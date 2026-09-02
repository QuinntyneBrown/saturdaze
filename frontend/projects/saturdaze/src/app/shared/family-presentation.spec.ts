import {
  commitmentIcon,
  commitmentSubtitle,
  kidsPhrase,
  memberSubtitle,
  memberTone,
} from './family-presentation';

describe('family-presentation', () => {
  it('rotates avatar tones oldest-first', () => {
    expect([0, 1, 2, 3, 4, 5].map(memberTone)).toEqual(['primary', 'leaf', 'sky', 'sun', 'indoor', 'primary']);
  });

  it('labels parents and kids', () => {
    expect(memberSubtitle({ age: 41 })).toBe('Parent · 41');
    expect(memberSubtitle({ age: 9 })).toBe('Kid · 9');
  });

  it('describes a commitment by day and time', () => {
    expect(commitmentSubtitle({ dayOfWeek: 'Saturday', startTime: '09:00:00', endTime: '10:00' })).toBe('Saturdays 09:00 – 10:00');
    expect(commitmentSubtitle({ dayOfWeek: 'Wednesday', startTime: '18:00', endTime: '19:00' })).toBe('Wednesdays 18:00 – 19:00');
  });

  it('picks an icon by title', () => {
    expect(commitmentIcon('Swim lessons')).toBe('bike');
    expect(commitmentIcon('Church')).toBe('bed');
    expect(commitmentIcon('Sunday dinner')).toBe('fork');
    expect(commitmentIcon('Piano')).toBe('calendar');
  });

  it('phrases the kids, oldest first', () => {
    const members = [
      { name: 'Mae', age: 5 },
      { name: 'Quinn', age: 41 },
      { name: 'Eli', age: 9 },
    ];
    expect(kidsPhrase(members)).toBe('Eli (9) and Mae (5)');
    expect(kidsPhrase([{ name: 'Eli', age: 9 }])).toBe('Eli (9)');
    expect(kidsPhrase([{ name: 'Quinn', age: 41 }])).toBe('');
    expect(kidsPhrase([{ name: 'A', age: 3 }, { name: 'B', age: 6 }, { name: 'C', age: 9 }])).toBe('C (9), B (6) and A (3)');
  });
});
