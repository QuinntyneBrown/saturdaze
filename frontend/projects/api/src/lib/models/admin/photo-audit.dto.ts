/** `GET /api/admin/photo-audit` (L2-122). Mirrors `Saturdaze.Application.Admin.Photos.PhotoAuditEntryDto`. */
export type PhotoAuditAction = 'upload' | 'addUrl' | 'edit' | 'primary' | 'remove' | 'review';

export interface PhotoAuditEntryDto {
  readonly id: string;
  /** UTC. */
  readonly occurredAt: string;
  readonly adminId: string;
  readonly adminEmail: string;
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent';
  readonly placeId: string;
  readonly placeName: string;
  readonly photoId: string;
  readonly action: PhotoAuditAction;
  /** JSON of the values before the action; null for a create. */
  readonly before: string | null;
  /** JSON of the values after the action; null for a removal. */
  readonly after: string | null;
}

export interface PhotoAuditPageDto {
  readonly items: readonly PhotoAuditEntryDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** The Activity log's filters (L2-122): one place, one administrator, a page. */
export interface PhotoAuditQuery {
  readonly kind: 'Activity' | 'Restaurant' | 'LocalEvent' | null;
  readonly placeId: string | null;
  readonly adminId: string | null;
  readonly page: number;
}

export const DEFAULT_PHOTO_AUDIT_QUERY: PhotoAuditQuery = {
  kind: null,
  placeId: null,
  adminId: null,
  page: 1,
};
