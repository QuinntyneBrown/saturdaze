import { ChipView } from '../chip-view';

/** One `.audit-row` on the admin Activity log (A7). */
export interface AuditRow {
  readonly id: string;
  /** "2026-10-06 14:02 UTC". */
  readonly time: string;
  /** The ISO instant for `<time datetime>`. */
  readonly datetime: string;
  readonly who: string;
  readonly adminId: string;
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly placeId: string;
  readonly placeName: string;
  readonly placeHref: string;
  readonly action: ChipView;
  /** "memorial-park-side.jpg → memorial-park.jpg". */
  readonly change: string;
}

export interface AuditPageView {
  readonly rows: readonly AuditRow[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** One ingestion run on the admin Ingestion photo skips screen (A6). */
export interface IngestionRunSkipsView {
  readonly runId: string;
  /** "Events". */
  readonly type: string;
  /** "6 Oct 2026, 04:12 UTC · 2 photo skips". */
  readonly meta: string;
  readonly status: ChipView;
  readonly skips: readonly {
    readonly placeName: string;
    /** `/places/{kind}/{id}`, or null when the place is gone. */
    readonly placeHref: string | null;
    readonly reason: string;
    readonly url: string;
  }[];
}
