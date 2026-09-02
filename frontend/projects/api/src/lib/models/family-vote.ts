import { Vote } from './vote';
import { VoterTone } from './voter-tone';

/**
 * Family Vote — one cell in a `sd-vote-row`: who, their avatar, their vote.
 */
export interface FamilyVote {
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Initial — the avatar letter.
   */
  readonly initial: string;
  /**
   * Tone.
   */
  readonly tone: VoterTone;
  /**
   * Vote.
   */
  readonly vote: Vote;
}
