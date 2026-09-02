import { block, weekendDto } from '../testing/weekend-fixture';
import { placementFor } from './errand-placement';

const milk = block({
  id: 'e2',
  day: 'Sunday',
  kind: 'Errand',
  title: 'Milk run',
  refId: 'err2',
  startTime: '09:15:00',
  endTime: '10:00:00',
  sortOrder: 5,
});

describe('placementFor', () => {
  it('finds the errand block that was not there before', () => {
    const before = weekendDto();
    const after = weekendDto({
      blocks: [...before.blocks, milk],
      errands: [
        ...before.errands,
        { id: 'err2', description: 'Milk run', estimatedMinutes: 45, done: false },
      ],
    });
    expect(placementFor(before, after, 'Milk run')).toEqual({
      description: 'Milk run',
      day: 'Sunday',
      time: '9:15',
      endTime: '10:00',
      blockId: 'e2',
    });
  });

  it('falls back to the newest errand with a matching description', () => {
    const after = weekendDto({
      blocks: [...weekendDto().blocks, milk],
      errands: [
        { id: 'err1', description: 'Costco run', estimatedMinutes: 45, done: false },
        { id: 'err2', description: 'milk run', estimatedMinutes: 45, done: false },
      ],
    });
    expect(placementFor(null, after, ' Milk Run ')).toMatchObject({ blockId: 'e2', day: 'Sunday' });
    expect(placementFor(after, after, 'Costco run')).toMatchObject({
      blockId: 'e1',
      day: 'Saturday',
    });
  });

  it('is null when the planner produced no block for it', () => {
    const before = weekendDto();
    const noBlock = weekendDto({
      errands: [
        ...before.errands,
        { id: 'err2', description: 'Milk run', estimatedMinutes: 45, done: false },
      ],
    });
    expect(placementFor(before, noBlock, 'Milk run')).toBeNull();
    expect(placementFor(null, weekendDto({ blocks: [] }), 'Anything')).toBeNull();
  });
});
