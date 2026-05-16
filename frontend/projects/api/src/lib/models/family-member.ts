import { FamilyMemberTone } from './family-member-tone';

export interface FamilyMember {
  readonly name: string;
  readonly tone: FamilyMemberTone;
  readonly subtitle: string;
}
