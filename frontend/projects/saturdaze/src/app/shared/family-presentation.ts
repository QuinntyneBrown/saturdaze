import type {
  EditableCommitment,
  EditableFamilyMember,
  FamilyMemberTone,
} from 'api';
import { memberTone as toneAt } from 'api';

/**
 * Presentation helpers for family members and commitments, shared by the
 * profile page and anywhere else a member row or commitment row renders.
 */

/** The avatar tone for the member at `index` (oldest first). */
export function memberTone(index: number): FamilyMemberTone {
  return toneAt(index);
}

/** "Parent · 41" / "Kid · 9". */
export function memberSubtitle(member: Pick<EditableFamilyMember, 'age'>): string {
  const role = member.age >= 18 ? 'Parent' : 'Kid';
  return `${role} · ${member.age}`;
}

/** "Saturdays 09:00 – 10:00". */
export function commitmentSubtitle(
  commitment: Pick<EditableCommitment, 'dayOfWeek' | 'startTime' | 'endTime'>,
): string {
  const day =
    commitment.dayOfWeek === 'Saturday' ? 'Saturdays' :
    commitment.dayOfWeek === 'Sunday' ? 'Sundays' :
    `${commitment.dayOfWeek}s`;
  return `${day} ${commitment.startTime.substring(0, 5)} – ${commitment.endTime.substring(0, 5)}`;
}

/** Stable icon assignment for commitments by title heuristic. */
export function commitmentIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('swim') || t.includes('workout') || t.includes('bike')) return 'bike';
  if (t.includes('church') || t.includes('bed')) return 'bed';
  if (t.includes('lunch') || t.includes('dinner')) return 'fork';
  return 'calendar';
}

/** "Eli (9) and Mae (5)" — kids only, oldest first. */
export function kidsPhrase(members: readonly EditableFamilyMember[]): string {
  const kids = members
    .filter((m) => m.age < 18)
    .slice()
    .sort((a, b) => b.age - a.age)
    .map((m) => `${m.name} (${m.age})`);
  if (kids.length === 0) return '';
  if (kids.length === 1) return kids[0]!;
  return `${kids.slice(0, -1).join(', ')} and ${kids[kids.length - 1]}`;
}
