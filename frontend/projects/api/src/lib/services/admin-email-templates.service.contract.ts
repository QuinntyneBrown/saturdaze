import { InjectionToken } from '@angular/core';

import {
  CreateEmailTemplateRequest,
  EmailPreviewDto,
  EmailTemplateRevisionDto,
  EmailTemplateStatus,
  EmailTemplatesQuery,
  PreviewEmailTemplateRequest,
  SaveEmailTemplateRequest,
} from '../models/admin/email-template.dto';
import {
  EmailRevisionRow,
  EmailTemplateRow,
  EmailTemplateView,
} from '../models/admin/email-template-view';

/**
 * Contract for Saturdaze Admin's email templates (L1-038). Admin pages
 * inject `ADMIN_EMAIL_TEMPLATES_SERVICE` and depend only on this interface.
 */
export interface IAdminEmailTemplatesService {
  /** `GET /api/admin/email-templates`: every template by name (L2-131). */
  list(query: EmailTemplatesQuery): Promise<EmailTemplateRow[]>;
  /** `GET /api/admin/email-templates/{id}`: one template for the editor (L2-133). */
  get(id: string): Promise<EmailTemplateView>;
  /** `POST /api/admin/email-templates`: a new draft; rejects with the server's error (L2-132). */
  create(request: CreateEmailTemplateRequest): Promise<EmailTemplateView>;
  /** `PUT /api/admin/email-templates/{id}`: saves the content; rejects with `template_stale` and other refusals (L2-133). */
  save(id: string, request: SaveEmailTemplateRequest): Promise<EmailTemplateView>;
  /** `POST /api/admin/email-templates/preview`: renders unsaved content with sample data (L2-134). */
  preview(request: PreviewEmailTemplateRequest): Promise<EmailPreviewDto>;
  /** `POST /api/admin/email-templates/{id}/status`: activate, archive or restore as a draft (L2-135). */
  setStatus(id: string, status: EmailTemplateStatus, version: number): Promise<EmailTemplateView>;
  /** `DELETE /api/admin/email-templates/{id}`: a non-system template and its history (L2-135). */
  remove(id: string): Promise<void>;
  /** `GET /api/admin/email-templates/{id}/revisions`: the history, newest first (L2-136). */
  revisions(id: string): Promise<EmailRevisionRow[]>;
  /** `GET /api/admin/email-templates/{id}/revisions/{version}`: one revision's content (L2-136). */
  revision(id: string, version: number): Promise<EmailTemplateRevisionDto>;
}

export const ADMIN_EMAIL_TEMPLATES_SERVICE = new InjectionToken<IAdminEmailTemplatesService>(
  'ADMIN_EMAIL_TEMPLATES_SERVICE',
);
