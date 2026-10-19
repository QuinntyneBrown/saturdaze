import { ItineraryBlockDto } from '../models/itinerary-block.dto';
import { remixPreviewRows } from './remix-preview';

function block(overrides: Partial<ItineraryBlockDto>): ItineraryBlockDto {
  return {
    id: 'b',
    day: 'Saturday',
    startTime: '10:00:00',
    endTime: '11:00:00',
    kind: 'Activity',
    title: 'Royal Botanical Gardens',
    refId: null,
    isLocked: false,
    reason: '',
    sortOrder: 0,
    ...overrides,
  } as ItineraryBlockDto;
}

describe('remixPreviewRows', () => {
  it('lists activities and meals by day and time, marking locked ones Keep', () => {
    const rows = remixPreviewRows([
      block({ day: 'Sunday', startTime: '14:00:00', title: 'Ontario Science Centre' }),
      block({ kind: 'Drive', title: 'Drive' }),
      block({ kind: 'Meal', startTime: '12:00:00', title: 'La Marina', isLocked: true }),
      block({ kind: 'Commitment', startTime: '09:00:00', title: 'Swim', isLocked: true }),
      block({}),
      block({ kind: 'Meal', startTime: '17:30:00', title: 'Dinner: Spice Lounge' }),
    ]);
    expect(rows).toEqual([
      { when: 'Saturday morning', title: 'Royal Botanical Gardens', keep: false },
      { when: 'Saturday lunch', title: 'La Marina, kept', keep: true },
      { when: 'Saturday dinner', title: 'Dinner: Spice Lounge', keep: false },
      { when: 'Sunday afternoon', title: 'Ontario Science Centre', keep: false },
    ]);
  });
});
