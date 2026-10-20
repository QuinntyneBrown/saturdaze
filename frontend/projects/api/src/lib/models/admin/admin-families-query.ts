/** The search and page of `GET /api/admin/families` (L2-157). */
export interface AdminFamiliesQuery {
  readonly q: string;
  readonly page: number;
}

export const DEFAULT_ADMIN_FAMILIES_QUERY: AdminFamiliesQuery = { q: '', page: 1 };

/** Reads a query from URL search params; a bad page falls back to the first. */
export function parseAdminFamiliesQuery(get: (key: string) => string | null): AdminFamiliesQuery {
  const page = Number(get('page') ?? '1');
  return { q: get('q') ?? '', page: Number.isInteger(page) && page > 0 ? page : 1 };
}

/** The URL search params for a query; defaults are left out so the address stays short. */
export function toAdminFamiliesParams(query: AdminFamiliesQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.q) params['q'] = query.q;
  if (query.page > 1) params['page'] = String(query.page);
  return params;
}
