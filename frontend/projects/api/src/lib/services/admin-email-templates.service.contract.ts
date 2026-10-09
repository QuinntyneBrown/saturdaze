import { InjectionToken } from '@angular/core';

import { EmailTemplatesQuery } from '../models/admin/email-template.dto';
import { EmailTemplateRow } from '../models/admin/email-template-view';

/**
 * Contract for Saturdaze Admin's email templates (L1-037). Admin pages
 * inject `ADMIN_EMAIL_TEMPLATES_SERVICE` and depend only on this interface.
 */
export interface IAdminEmailTemplatesService {
  /** `GET /api/admin/email-templates`: every template by name (L2-125). */
  list(query: EmailTemplatesQuery): Promise<EmailTemplateRow[]>;
}

export const ADMIN_EMAIL_TEMPLATES_SERVICE = new InjectionToken<IAdminEmailTemplatesService>(
  'ADMIN_EMAIL_TEMPLATES_SERVICE',
);
