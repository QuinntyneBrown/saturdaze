import { PlaceRow } from './place-row';

/** The admin Places screen's state. */
export interface AdminPlacesView {
  readonly status: 'loading' | 'ready' | 'empty';
  readonly rows: readonly PlaceRow[];
  /** Places matching the query across every page. */
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}
