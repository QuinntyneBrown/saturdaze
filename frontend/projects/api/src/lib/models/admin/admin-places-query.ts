/** The filters, sort and page of `GET /api/admin/places` (L2-113). */
export interface AdminPlacesQuery {
  readonly q: string;
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent' | null;
  readonly flag: 'no-photo' | 'blocked-url' | 'unreviewed' | 'missing-alt' | null;
  readonly source: 'Curated' | 'Provider' | null;
  readonly upcoming: boolean;
  readonly sort: 'health' | 'name' | 'changed';
  readonly page: number;
}

export const DEFAULT_ADMIN_PLACES_QUERY: AdminPlacesQuery = {
  q: '',
  kind: null,
  flag: null,
  source: null,
  upcoming: false,
  sort: 'health',
  page: 1,
};

/** Reads a query from URL search params; unknown values fall back to the defaults. */
export function parseAdminPlacesQuery(get: (key: string) => string | null): AdminPlacesQuery {
  const kind = get('kind');
  const flag = get('flag');
  const source = get('source');
  const sort = get('sort');
  const page = Number(get('page') ?? '1');
  return {
    q: get('q') ?? '',
    kind: kind === 'Activity' || kind === 'Restaurant' || kind === 'LocalEvent' ? kind : null,
    flag:
      flag === 'no-photo' ||
      flag === 'blocked-url' ||
      flag === 'unreviewed' ||
      flag === 'missing-alt'
        ? flag
        : null,
    source: source === 'Curated' || source === 'Provider' ? source : null,
    upcoming: get('upcoming') === 'true',
    sort: sort === 'name' || sort === 'changed' ? sort : 'health',
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** The URL search params for a query; defaults are left out so the address stays short. */
export function toAdminPlacesParams(query: AdminPlacesQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.q) params['q'] = query.q;
  if (query.kind) params['kind'] = query.kind;
  if (query.flag) params['flag'] = query.flag;
  if (query.source) params['source'] = query.source;
  if (query.upcoming) params['upcoming'] = 'true';
  if (query.sort !== 'health') params['sort'] = query.sort;
  if (query.page > 1) params['page'] = String(query.page);
  return params;
}
