import { Vote } from './vote';
import { VoterTone } from './voter-tone';

/**
 * Family Vote.
 */
export interface FamilyVote {
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Tone.
   */
  readonly tone: VoterTone;
  /**
   * Vote.
   */
  readonly vote: Vote;
}
