import { DayOfWeek } from '../models/day-of-week';
import { MemberRole } from '../models/member-row';
import { hhmm, timeRange } from './format';

/**
 * Presentation helpers for family members and commitments, shared by the
 * Family page, the empty Weekend screen and the Ideas subtitle. Structural
 * input types so both the editable profile and the raw dto fit.
 */

/** What the helpers need to know about a person. */
export interface MemberLike {
  readonly name: string;
  readonly age: number;
}

/** What the helpers need to know about a commitment. */
export interface CommitmentLike {
  readonly title: string;
  readonly dayOfWeek: DayOfWeek;
  readonly startTime: string;
  readonly endTime: string;
}

export const ADULT_AGE = 18;

/** 18 and over is a parent; everyone else is a kid. */
export function memberRole(age: number): MemberRole {
  return age >= ADULT_AGE ? 'Parent' : 'Kid';
}

/** "Parent · 38" / "Kid · 9". */
export function memberSubtitle(member: Pick<MemberLike, 'age'>): string {
  return `${memberRole(member.age)} · ${member.age}`;
}

/** "Saturdays" / "Wednesdays". */
export function commitmentDayLabel(dayOfWeek: DayOfWeek): string {
  return `${dayOfWeek}s`;
}

/** "Saturdays · 9:00 to 10:00" / "Saturdays · 5:00 to 6:00pm". */
export function commitmentSubtitle(commitment: Omit<CommitmentLike, 'title'>): string {
  return `${commitmentDayLabel(commitment.dayOfWeek)} · ${timeRange(
    commitment.startTime,
    commitment.endTime,
  )}`;
}

/** Stable icon assignment for commitments by title heuristic. */
export function commitmentIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('swim') || t.includes('workout') || t.includes('bike')) return 'bike';
  if (t.includes('church') || t.includes('bed')) return 'bed';
  if (t.includes('lunch') || t.includes('dinner')) return 'fork';
  return 'calendar';
}

/** "Eli and Mae" — the kids' names, oldest first; "" when there are none. */
export function kidsPhrase(members: readonly MemberLike[]): string {
  const kids = members
    .filter((m) => memberRole(m.age) === 'Kid')
    .slice()
    .sort((a, b) => b.age - a.age)
    .map((m) => m.name);
  return joinNames(kids);
}

/** "2 parents · Eli 9 · Mae 5" — the "Planned around" people line. */
export function membersSummary(members: readonly MemberLike[]): string {
  const parents = members.filter((m) => memberRole(m.age) === 'Parent').length;
  const kids = members
    .filter((m) => memberRole(m.age) === 'Kid')
    .slice()
    .sort((a, b) => b.age - a.age)
    .map((m) => `${m.name} ${m.age}`);
  const parts: string[] = [];
  if (parents > 0) parts.push(`${parents} parent${parents === 1 ? '' : 's'}`);
  parts.push(...kids);
  return parts.length > 0 ? parts.join(' · ') : 'Nobody added yet';
}

/** "Swim lessons Sat 9:00 · Church Sun 10:30" — the "Planned around" anchors line. */
export function commitmentsSummary(commitments: readonly CommitmentLike[]): string {
  if (commitments.length === 0) return 'Add swim, church or anything fixed';
  return commitments
    .map((c) => `${c.title} ${c.dayOfWeek.slice(0, 3)} ${hhmm(c.startTime)}`)
    .join(' · ');
}

/** "Eli", "Eli and Mae", "Eli, Mae and Sam". */
export function joinNames(names: readonly string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
