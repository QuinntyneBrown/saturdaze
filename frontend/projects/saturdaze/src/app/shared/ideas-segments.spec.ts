import { IDEAS_SEGMENTS } from './ideas-segments';

describe('IDEAS_SEGMENTS', () => {
  it('lists Activities, Food and Events in order', () => {
    expect(IDEAS_SEGMENTS.map((t) => t.label)).toEqual(['Activities', 'Food', 'Events']);
  });

  it('routes each segment to its Ideas child path', () => {
    expect(IDEAS_SEGMENTS.map((t) => t.link)).toEqual(['/ideas', '/ideas/food', '/ideas/events']);
  });

  it('only matches Activities exactly so /ideas/food does not light it up too', () => {
    expect(IDEAS_SEGMENTS[0]!.exact).toBe(true);
    expect(IDEAS_SEGMENTS[1]!.exact).toBeUndefined();
    expect(IDEAS_SEGMENTS[2]!.exact).toBeUndefined();
  });
});
