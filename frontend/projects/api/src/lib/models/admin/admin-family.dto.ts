/** `GET /api/admin/families` wire shapes (L2-157, L2-159). */
export interface AdminWeekendSummaryDto {
  readonly id: string;
  readonly weekendOf: string;
  readonly title: string | null;
  readonly blockCount: number;
  readonly lockedCount: number;
  readonly regenerateCount: number;
}

export interface AdminFamilyDto {
  readonly id: string;
  readonly name: string;
  readonly homeLocation: string;
  readonly memberCount: number;
  /** Sign-in emails, the owner first. */
  readonly accounts: readonly string[];
  readonly ownerEmail: string | null;
  readonly upcoming: AdminWeekendSummaryDto | null;
}

export interface AdminFamilyPageDto {
  readonly items: readonly AdminFamilyDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

export interface AdminFamilyMemberDto {
  readonly id: string;
  readonly name: string;
  readonly age: number;
}

export interface AdminFamilyCommitmentDto {
  readonly id: string;
  readonly title: string;
  readonly dayOfWeek: string;
  readonly startTime: string;
  readonly endTime: string;
}

export interface AdminFamilyDetailDto {
  readonly family: AdminFamilyDto;
  readonly upcomingWeekendOf: string;
  readonly members: readonly AdminFamilyMemberDto[];
  readonly commitments: readonly AdminFamilyCommitmentDto[];
}
