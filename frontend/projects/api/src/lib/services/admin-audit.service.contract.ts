import { InjectionToken } from '@angular/core';

import { AuditPageView, IngestionRunSkipsView } from '../models/admin/audit-row';
import { PhotoAuditQuery } from '../models/admin/photo-audit.dto';

/**
 * Contract for Saturdaze Admin's read-only records (L2-120 AC5, L2-122).
 * Admin pages inject `ADMIN_AUDIT_SERVICE` and depend only on this interface.
 */
export interface IAdminAuditService {
  /** `GET /api/admin/photo-audit`: every admin photo change, newest first. */
  list(query: PhotoAuditQuery): Promise<AuditPageView>;
  /** `GET /api/admin/ingestion-runs/photo-skips`: each run's photo skips. */
  ingestionSkips(): Promise<IngestionRunSkipsView[]>;
}

export const ADMIN_AUDIT_SERVICE = new InjectionToken<IAdminAuditService>('ADMIN_AUDIT_SERVICE');
