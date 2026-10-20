/** `GET /api/admin/families/{id}/weekend-changes` wire shapes (L2-161). */
export type WeekendChangeAction =
  | 'plan'
  | 'regenerate'
  | 'regenerateDay'
  | 'lockDay'
  | 'unlockDay'
  | 'lockBlock'
  | 'unlockBlock'
  | 'swap';

export interface WeekendChangeDto {
  readonly id: string;
  readonly occurredAt: string;
  readonly adminId: string;
  readonly adminEmail: string;
  readonly weekendId: string;
  readonly weekendOf: string;
  readonly action: WeekendChangeAction;
  readonly day: string | null;
  readonly blockId: string | null;
  readonly before: string | null;
  readonly after: string | null;
  readonly summary: string;
}

export interface WeekendChangePageDto {
  readonly items: readonly WeekendChangeDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
