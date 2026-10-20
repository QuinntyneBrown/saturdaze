import { ChipView } from '../chip-view';

/** One row of the admin Families list (A8). */
export interface FamilyRow {
  readonly id: string;
  readonly name: string;
  /** "4 members · 2 accounts · Port Credit, Mississauga, ON". */
  readonly meta: string;
  /** "quinn@example.com · admin@saturdaze.ca". */
  readonly accounts: string;
  /** "Planned · 14 blocks" (and "2 locked") or "Not planned". */
  readonly flags: readonly ChipView[];
  /** The Family weekend screen for this row. */
  readonly href: string;
}

/** The admin Families screen's state. */
export interface AdminFamiliesView {
  readonly status: 'loading' | 'ready' | 'empty';
  readonly rows: readonly FamilyRow[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
