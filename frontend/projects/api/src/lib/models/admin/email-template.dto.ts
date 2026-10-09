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
