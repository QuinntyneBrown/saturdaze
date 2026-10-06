import { PlaceRow } from './place-row';

/** The admin Places screen's state. */
export interface AdminPlacesView {
  readonly status: 'loading' | 'ready' | 'empty';
  readonly rows: readonly PlaceRow[];
  readonly total: number;
}
