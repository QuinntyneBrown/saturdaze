/**
 * Saturdaze Admin's email template wire shapes (L2-124 → L2-130). Mirror
 * `Saturdaze.Application.Admin.EmailTemplates`.
 */
export type EmailTemplateCategory =
  | 'Account'
  | 'Notification'
  | 'Scheduled'
  | 'SpecialOccasion'
  | 'Marketing';

export type EmailTemplateStatus = 'Draft' | 'Active' | 'Archived';

/** `GET /api/admin/email-templates` (L2-125). */
export interface EmailTemplateSummaryDto {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly category: EmailTemplateCategory;
  readonly status: EmailTemplateStatus;
  readonly isSystem: boolean;
  readonly subject: string;
  readonly version: number;
  /** UTC. */
  readonly updatedAt: string;
  readonly updatedByEmail: string;
}

/** The Email templates screen's filters (L2-125), kept in the URL. */
export interface EmailTemplatesQuery {
  readonly q: string;
  readonly category: EmailTemplateCategory | null;
  readonly status: EmailTemplateStatus | null;
}

/** `GET /api/admin/email-templates/{id}`: a template with its content (L2-127). */
export interface EmailTemplateDto {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly category: EmailTemplateCategory;
  readonly status: EmailTemplateStatus;
  readonly isSystem: boolean;
  readonly subject: string;
  readonly preheader: string;
  readonly htmlBody: string;
  readonly textBody: string;
  readonly sampleData: Readonly<Record<string, string>>;
  /** Placeholders both bodies keep (a system template's link, a marketing unsubscribe). */
  readonly requiredPlaceholders: readonly string[];
  readonly version: number;
  /** UTC. */
  readonly createdAt: string;
  readonly createdByEmail: string;
  /** UTC. */
  readonly updatedAt: string;
  readonly updatedByEmail: string;
}

/** `POST /api/admin/email-templates` (L2-126). */
export interface CreateEmailTemplateRequest {
  readonly key: string;
  readonly name: string;
  readonly description: string;
  readonly category: EmailTemplateCategory;
  /** Copy this template's content instead of the category's starter. */
  readonly duplicateOf?: string;
}

/** `PUT /api/admin/email-templates/{id}` (L2-127): the content and the version it was loaded at. */
export interface SaveEmailTemplateRequest {
  readonly name: string;
  readonly description: string;
  readonly subject: string;
  readonly preheader: string;
  readonly htmlBody: string;
  readonly textBody: string;
  readonly sampleData: Readonly<Record<string, string>>;
  readonly version: number;
}

/** `POST /api/admin/email-templates/preview` (L2-128): unsaved content to render. */
export type PreviewEmailTemplateRequest = Omit<
  SaveEmailTemplateRequest,
  'name' | 'description' | 'version'
>;

/** One placeholder the preview filled, and where its value came from. */
export interface EmailPlaceholderDto {
  readonly name: string;
  readonly value: string;
  readonly source: 'sample' | 'builtin' | 'missing';
}

/** The rendered preview (L2-128). */
export interface EmailPreviewDto {
  readonly subject: string;
  readonly preheader: string;
  readonly html: string;
  readonly text: string;
  readonly placeholders: readonly EmailPlaceholderDto[];
}

/** `GET /api/admin/email-templates/{id}/revisions` (L2-130): one row of the history. */
export interface EmailTemplateRevisionSummaryDto {
  readonly version: number;
  readonly action: 'create' | 'edit' | 'status';
  readonly status: EmailTemplateStatus;
  readonly subject: string;
  /** UTC. */
  readonly occurredAt: string;
  readonly adminEmail: string;
}

/** `GET /api/admin/email-templates/{id}/revisions/{version}` (L2-130): a revision's content. */
export interface EmailTemplateRevisionDto extends EmailTemplateRevisionSummaryDto {
  readonly name: string;
  readonly preheader: string;
  readonly htmlBody: string;
  readonly textBody: string;
  readonly sampleData: Readonly<Record<string, string>>;
}
