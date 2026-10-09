import { InjectionToken } from '@angular/core';

import {
  CreateEmailTemplateRequest,
  EmailTemplatesQuery,
} from '../models/admin/email-template.dto';
import { EmailTemplateRow, EmailTemplateView } from '../models/admin/email-template-view';

/**
 * Contract for Saturdaze Admin's email templates (L1-037). Admin pages
 * inject `ADMIN_EMAIL_TEMPLATES_SERVICE` and depend only on this interface.
 */
export interface IAdminEmailTemplatesService {
  /** `GET /api/admin/email-templates`: every template by name (L2-125). */
  list(query: EmailTemplatesQuery): Promise<EmailTemplateRow[]>;
  /** `GET /api/admin/email-templates/{id}`: one template for the editor (L2-127). */
  get(id: string): Promise<EmailTemplateView>;
  /** `POST /api/admin/email-templates`: a new draft; rejects with the server's error (L2-126). */
  create(request: CreateEmailTemplateRequest): Promise<EmailTemplateView>;
}

export const ADMIN_EMAIL_TEMPLATES_SERVICE = new InjectionToken<IAdminEmailTemplatesService>(
  'ADMIN_EMAIL_TEMPLATES_SERVICE',
);
