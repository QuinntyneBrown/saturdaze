import { ChipView } from '../chip-view';

/** One row of the Invitations screen's invite list (A8, L2-158). */
export interface InvitationRow {
  readonly id: string;
  readonly email: string;
  /** "Sample weekend · The Riveras · Sat 24 Oct" or "No sample weekend". */
  readonly sample: string;
  /** "Invited by … · 2 hours ago · Expires in 14 days". */
  readonly meta: string;
  readonly status: ChipView;
  /** Pending rows offer Revoke (AD8). */
  readonly canRevoke: boolean;
}

/** One row of the Invitations screen's sample weekends list (A8, L2-159). */
export interface ProspectRow {
  readonly id: string;
  readonly familyName: string;
  /** "Sat 24 – Sun 25 Oct · Dani 38, Mateo 7 · Port Credit". */
  readonly meta: string;
  readonly status: ChipView;
  readonly href: string;
  /** The AD7 option label: "The Riveras · Sat 24 Oct". */
  readonly optionLabel: string;
}
