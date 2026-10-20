import { WeekendDto } from '../weekend.dto';

/** Derived state of a prospect (L2-159). */
export type ProspectStatus = 'Draft' | 'Invited' | 'Claimed';

export interface ProspectMemberDto {
  readonly name: string;
  readonly age: number;
}

/** `GET /api/admin/prospects` row; `weekend` is present on the single read and on writes. Mirrors `ProspectDto`. */
export interface ProspectDto {
  readonly id: string;
  readonly familyName: string;
  readonly homeLocation: string;
  readonly members: readonly ProspectMemberDto[];
  readonly likes: readonly string[];
  /** The Saturday, `YYYY-MM-DD`. */
  readonly weekendOf: string;
  readonly weekendId: string;
  readonly status: ProspectStatus;
  readonly createdAtUtc: string;
  readonly invitationCount: number;
  readonly weekend: WeekendDto | null;
}

/** `POST /api/admin/prospects` (L2-159). */
export interface CreateProspectRequest {
  readonly familyName: string;
  readonly homeLocation: string | null;
  readonly members: readonly ProspectMemberDto[];
  readonly likes: readonly string[];
  /** The Saturday, `YYYY-MM-DD`; `null` means the upcoming one. */
  readonly weekendOf: string | null;
}
