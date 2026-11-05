import { CoupleDateDto, CoupleDatesDto, DateSummaryDto } from '../models/couple-date.dto';
import { CoupleDateView, DatePlanningView, DateStepView } from '../models/couple-date-view';
import { clock12, formatDuration, hhmm12, minutesBetween, toMinutes } from './format';

/** "5:15–8:15pm", or "11:45am–2:30pm" across noon (L2-222 AC4, the mock's care chip). */
export function compactRange(start: string, end: string): string {
  const samePart = toMinutes(start) >= 12 * 60 === toMinutes(end) >= 12 * 60;
  return `${samePart ? hhmm12(start) : clock12(start)}–${clock12(end)}`;
}

/** "Ada and Ben", "Ada, Ben and Cy". */
export function andList(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function stepIcon(kind: DateStepView['kind']): string {
  switch (kind) {
    case 'Drive':
      return 'car';
    case 'Meal':
      return 'fork';
    default:
      return 'tree';
  }
}

/** A date for its own screen (L2-225). */
export function toCoupleDateView(dto: CoupleDateDto): CoupleDateView {
  const range = compactRange(dto.startTime, dto.endTime);
  const names = andList(dto.attendees.map((a) => a.name));
  const care = dto.kidsNeedCare.length > 0;
  return {
    id: dto.id,
    day: dto.day,
    meal: dto.meal,
    headline: `${dto.meal} date`,
    subtitle: `${dto.day} · ${range} · ${names}`,
    restaurantName: dto.restaurant.name,
    hasActivity: dto.activity !== null,
    activityName: dto.activity?.name ?? null,
    steps: dto.steps.map((s) => ({
      kind: s.kind,
      title: s.title,
      time: clock12(s.startTime),
      duration: formatDuration(minutesBetween(s.startTime, s.endTime)),
      icon: stepIcon(s.kind),
      reason: s.reason,
    })),
    careTitle: care ? `Kids need care ${range}.` : null,
    careBody: care
      ? `${andList(dto.kidsNeedCare)} stay on the family plan, which pauses for the date. Saturdaze does not book childcare.`
      : null,
    attendeeIds: dto.attendees.map((a) => a.id),
  };
}

export function toDatePlanningView(dto: CoupleDatesDto): DatePlanningView {
  return {
    adults: dto.adults.map((a) => ({ id: a.id, name: a.name })),
    canPlan: dto.canPlan,
    reason: dto.reason,
  };
}

/** "Sunday dinner at Snug Harbour · Ada and Ben" for /past (L2-225 AC7). */
export function pastDateLine(d: DateSummaryDto): string {
  return `${d.day} ${d.meal.toLowerCase()} at ${d.restaurant} · ${andList(d.attendees)}`;
}
