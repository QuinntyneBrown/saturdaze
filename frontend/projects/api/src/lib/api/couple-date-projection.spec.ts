import { CoupleDateDto } from '../models/couple-date.dto';
import { andList, compactRange, pastDateLine, toCoupleDateView } from './couple-date-projection';

const DATE: CoupleDateDto = {
  id: 'd1',
  weekendId: 'w1',
  day: 'Sunday',
  meal: 'Dinner',
  startTime: '17:15:00',
  endTime: '20:15:00',
  attendees: [
    { id: 'm1', name: 'Quinn' },
    { id: 'm2', name: 'Sara' },
  ],
  restaurant: { id: 'r1', name: 'Snug Harbour', style: 'Seafood' },
  activity: { id: 'a1', name: 'Memorial Park' },
  steps: [
    {
      kind: 'Drive',
      title: 'Drive to Memorial Park',
      startTime: '17:15:00',
      endTime: '17:25:00',
      reason: '10 min from home',
      refId: null,
      stop: null,
    },
    {
      kind: 'Activity',
      title: 'Memorial Park',
      startTime: '17:25:00',
      endTime: '18:25:00',
      reason: '5 min from Snug Harbour',
      refId: 'a1',
      stop: null,
    },
    {
      kind: 'Meal',
      title: 'Dinner at Snug Harbour',
      startTime: '18:30:00',
      endTime: '20:00:00',
      reason: 'near home',
      refId: 'r1',
      stop: null,
    },
    {
      kind: 'Drive',
      title: 'Drive home from Snug Harbour',
      startTime: '20:00:00',
      endTime: '20:15:00',
      reason: '15 min home',
      refId: null,
      stop: null,
    },
  ],
  kidsNeedCare: ['Eli', 'Mae'],
  title: 'Dinner date at Snug Harbour',
};

describe('couple date projection', () => {
  it('formats a range compactly, with one suffix when both ends share it', () => {
    expect(compactRange('17:15:00', '20:15:00')).toBe('5:15–8:15pm');
    expect(compactRange('11:45:00', '14:30:00')).toBe('11:45am–2:30pm');
  });

  it('joins names in plain words', () => {
    expect(andList(['Quinn'])).toBe('Quinn');
    expect(andList(['Quinn', 'Sara'])).toBe('Quinn and Sara');
    expect(andList(['A', 'B', 'C'])).toBe('A, B and C');
  });

  it('maps a date to its screen with who needs care', () => {
    const view = toCoupleDateView(DATE);
    expect(view.headline).toBe('Dinner date');
    expect(view.subtitle).toBe('Sunday · 5:15–8:15pm · Quinn and Sara');
    expect(view.careTitle).toBe('Kids need care 5:15–8:15pm.');
    expect(view.careBody).toContain('Eli and Mae stay on the family plan');
    expect(view.steps.map((s) => s.icon)).toEqual(['car', 'tree', 'fork', 'car']);
    expect(view.steps[2]).toMatchObject({ time: '6:30pm', duration: '90m' });
  });

  it('leaves out care when nobody stays home', () => {
    const view = toCoupleDateView({ ...DATE, kidsNeedCare: [] });
    expect(view.careTitle).toBeNull();
    expect(view.careBody).toBeNull();
  });

  it('writes a past date as one line', () => {
    expect(
      pastDateLine({
        day: 'Sunday',
        meal: 'Dinner',
        restaurant: 'Snug Harbour',
        attendees: ['Quinn', 'Sara'],
      }),
    ).toBe('Sunday dinner at Snug Harbour · Quinn and Sara');
  });
});
