import {
  commitmentDayLabel,
  commitmentIcon,
  commitmentSubtitle,
  commitmentsSummary,
  joinNames,
  kidsPhrase,
  memberRole,
  memberSubtitle,
  membersSummary,
} from './family-presentation';

const members = [
  { name: 'Mae', age: 5 },
  { name: 'Quinn', age: 38 },
  { name: 'Eli', age: 9 },
  { name: 'Sara', age: 36 },
];

describe('family-presentation', () => {
  it('derives the role from age: 18 and over is a parent', () => {
    expect(memberRole(38)).toBe('Parent');
    expect(memberRole(18)).toBe('Parent');
    expect(memberRole(17)).toBe('Kid');
    expect(memberRole(5)).toBe('Kid');
  });

  it('labels parents and kids', () => {
    expect(memberSubtitle({ age: 38 })).toBe('Parent · 38');
    expect(memberSubtitle({ age: 9 })).toBe('Kid · 9');
  });

  it('describes a commitment by day and 12-hour range', () => {
    expect(commitmentDayLabel('Saturday')).toBe('Saturdays');
    expect(
      commitmentSubtitle({ dayOfWeek: 'Saturday', startTime: '09:00:00', endTime: '10:00' }),
    ).toBe('Saturdays · 9:00 to 10:00');
    expect(commitmentSubtitle({ dayOfWeek: 'Sunday', startTime: '10:30', endTime: '11:45' })).toBe(
      'Sundays · 10:30 to 11:45',
    );
    expect(
      commitmentSubtitle({ dayOfWeek: 'Saturday', startTime: '17:00', endTime: '18:00' }),
    ).toBe('Saturdays · 5:00 to 6:00pm');
    expect(
      commitmentSubtitle({ dayOfWeek: 'Wednesday', startTime: '18:00', endTime: '19:00' }),
    ).toBe('Wednesdays · 6:00 to 7:00pm');
  });

  it('picks an icon by title', () => {
    expect(commitmentIcon('Swim lessons')).toBe('bike');
    expect(commitmentIcon('Church')).toBe('bed');
    expect(commitmentIcon('Sunday dinner')).toBe('fork');
    expect(commitmentIcon('Piano')).toBe('calendar');
  });

  it('phrases the kids by name, oldest first', () => {
    expect(kidsPhrase(members)).toBe('Eli and Mae');
    expect(kidsPhrase([{ name: 'Eli', age: 9 }])).toBe('Eli');
    expect(kidsPhrase([{ name: 'Quinn', age: 41 }])).toBe('');
    expect(
      kidsPhrase([
        { name: 'A', age: 3 },
        { name: 'B', age: 6 },
        { name: 'C', age: 9 },
      ]),
    ).toBe('C, B and A');
  });

  it('summarises who is in the family for the planned-around row', () => {
    expect(membersSummary(members)).toBe('2 parents · Eli 9 · Mae 5');
    expect(membersSummary([{ name: 'Quinn', age: 38 }])).toBe('1 parent');
    expect(membersSummary([{ name: 'Eli', age: 9 }])).toBe('Eli 9');
    expect(membersSummary([])).toBe('Nobody added yet');
  });

  it('summarises the commitments for the planned-around row', () => {
    expect(
      commitmentsSummary([
        { title: 'Swim lessons', dayOfWeek: 'Saturday', startTime: '09:00', endTime: '10:00' },
        { title: 'Church', dayOfWeek: 'Sunday', startTime: '10:30:00', endTime: '11:45:00' },
        { title: 'Workout', dayOfWeek: 'Saturday', startTime: '17:00', endTime: '18:00' },
      ]),
    ).toBe('Swim lessons Sat 9:00 · Church Sun 10:30 · Workout Sat 17:00');
    expect(commitmentsSummary([])).toBe('Add swim, church or anything fixed');
  });

  it('joins names with commas and a final "and"', () => {
    expect(joinNames([])).toBe('');
    expect(joinNames(['Eli'])).toBe('Eli');
    expect(joinNames(['parks', 'theatre'])).toBe('parks and theatre');
    expect(joinNames(['a', 'b', 'c'])).toBe('a, b and c');
  });
});
