import { ChipView } from '../chip-view';
import { WeekendSummaryDto } from '../weekend-summary.dto';
import { WeekendView } from '../weekend-view';
import { FamilyRow } from './family-row';

/** The Family weekend screen's header (A9). */
export interface FamilyHeaderView {
  readonly id: string;
  readonly name: string;
  /** "Port Credit, Mississauga, ON · 4 members · 2 accounts · Weekend of 17 – 18 May". */
  readonly meta: string;
  readonly upcomingWeekendOf: string;
  readonly row: FamilyRow;
}

/** One administrator change as the Changes section lists it. */
export interface WeekendChangeRow {
  readonly id: string;
  /** "15 May 2026, 2:02pm UTC". */
  readonly time: string;
  readonly datetime: string;
  readonly who: string;
  readonly action: ChipView;
  readonly summary: string;
}

/** One past weekend as the Past weekends section lists it. */
export interface PastWeekendRow {
  readonly id: string;
  /** "10 – 11 May · Bronte Creek + Rec Room". */
  readonly title: string;
  /** "Bronte Creek Provincial Park · Rec Room Mississauga · 5 of 5". */
  readonly subtitle: string;
  readonly icon: string;
  readonly favourite: boolean;
}

export type { WeekendSummaryDto, WeekendView };
