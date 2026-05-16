import { Vote } from './vote';
import { VoterTone } from './voter-tone';

export interface FamilyVote {
  readonly name: string;
  readonly tone: VoterTone;
  readonly vote: Vote;
}
