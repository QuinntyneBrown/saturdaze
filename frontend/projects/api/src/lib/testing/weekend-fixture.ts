import { ItineraryBlockDto } from '../models/itinerary-block.dto';
import { WeekendDto } from '../models/weekend.dto';

/**
 * A representative weekend for specs: a commitment, a drive into an
 * activity, a meal, an errand, and a locked Sunday activity. Saturday is
 * sunny and warm; Sunday is cloudy.
 */

export function block(overrides: Partial<ItineraryBlockDto> = {}): ItineraryBlockDto {
  return {
    id: 'b1',
    day: 'Saturday',
    startTime: '09:00:00',
    endTime: '10:00:00',
    kind: 'Activity',
    title: 'Terre Bleu',
    refId: 'a1',
    isLocked: false,
    reason: 'Sunny morning',
    sortOrder: 0,
    ...overrides,
  };
}

export function weekendDto(overrides: Partial<WeekendDto> = {}): WeekendDto {
  return {
    id: 'w1',
    weekendOf: '2026-05-16',
    isFavourite: false,
    notes: '',
    regenerateCount: 0,
    title: null,
    rating: null,
    blocks: [
      block({
        id: 'c1',
        kind: 'Commitment',
        title: 'Swim lessons',
        refId: null,
        isLocked: true,
        reason: 'fixed commitment',
        sortOrder: 0,
      }),
      block({
        id: 'd1',
        kind: 'Drive',
        title: 'Drive to Terre Bleu',
        refId: null,
        startTime: '10:15:00',
        endTime: '11:00:00',
        reason: '',
        sortOrder: 1,
      }),
      block({
        id: 'b1',
        title: 'Lavender fields',
        startTime: '11:00:00',
        endTime: '13:00:00',
        reason: 'Sunny morning, Mae can walk the rows',
        sortOrder: 2,
      }),
      block({
        id: 'm1',
        kind: 'Meal',
        title: 'Lunch at La Marina',
        refId: 'r1',
        startTime: '13:00:00',
        endTime: '14:15:00',
        reason: 'Wife-approved · patio',
        sortOrder: 3,
      }),
      block({
        id: 'e1',
        kind: 'Errand',
        title: 'Costco run',
        refId: 'err1',
        startTime: '15:00:00',
        endTime: '15:45:00',
        reason: 'Paper towels, bread',
        sortOrder: 4,
      }),
      block({
        id: 's1',
        day: 'Sunday',
        kind: 'Meal',
        title: 'Pancakes at home',
        refId: null,
        startTime: '08:30:00',
        endTime: '09:15:00',
        reason: 'Mae flips, Eli pours',
        sortOrder: 0,
      }),
      block({
        id: 's2',
        day: 'Sunday',
        title: 'The Rec Room',
        refId: 'a2',
        startTime: '13:30:00',
        endTime: '15:30:00',
        isLocked: true,
        reason: "Eli's pick",
        sortOrder: 1,
      }),
      block({
        id: 's3',
        day: 'Sunday',
        kind: 'Downtime',
        title: 'Quiet time at home',
        refId: null,
        startTime: '16:00:00',
        endTime: '17:30:00',
        reason: '',
        sortOrder: 2,
      }),
    ],
    errands: [{ id: 'err1', description: 'Costco run', estimatedMinutes: 45, done: false }],
    weather: [
      {
        date: '2026-05-16',
        tags: ['sunny', 'warm'],
        highCelsius: 22,
        lowCelsius: 14,
        precipitationMm: 0,
        unavailable: false,
      },
      {
        date: '2026-05-17',
        tags: ['cloudy'],
        highCelsius: 18,
        lowCelsius: 12,
        precipitationMm: 0,
        unavailable: false,
      },
    ],
    ...overrides,
  };
}

/** Let pending promise continuations run (one macrotask). */
export function settle(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}
