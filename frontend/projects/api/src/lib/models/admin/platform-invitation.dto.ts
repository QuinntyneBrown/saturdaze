/** Derived state of a platform invitation (L2-158). */
export type PlatformInvitationStatus = 'Pending' | 'Accepted' | 'Expired' | 'Revoked';

/** The sample weekend an invitation carries. Mirrors `SampleWeekendSummaryDto`. */
export interface SampleWeekendSummaryDto {
  readonly prospectId: string;
  readonly familyName: string;
  /** The Saturday, `YYYY-MM-DD`. */
  readonly weekendOf: string;
}

/** `GET /api/admin/invitations` row and `POST` result item. Mirrors `PlatformInvitationDto`. */
export interface PlatformInvitationDto {
  readonly id: string;
  readonly email: string;
  readonly status: PlatformInvitationStatus;
  readonly sampleWeekend: SampleWeekendSummaryDto | null;
  readonly invitedByEmail: string | null;
  readonly message: string | null;
  readonly createdAtUtc: string;
  readonly expiresAtUtc: string;
  readonly acceptedAtUtc: string | null;
  /** The join link; only the send response carries it (L2-157). */
  readonly url: string | null;
}

/** `POST /api/admin/invitations` (L2-157). */
export interface SendInvitationsRequest {
  readonly emails: readonly string[];
  readonly prospectId: string | null;
  readonly message: string | null;
}

export interface SendInvitationsResultDto {
  readonly invitations: readonly PlatformInvitationDto[];
}
