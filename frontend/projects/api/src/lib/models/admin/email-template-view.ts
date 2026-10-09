import { ChipView } from '../chip-view';
import {
  EmailTemplateCategory,
  EmailTemplateStatus,
  EmailTemplatesQuery,
} from './email-template.dto';

/** One row of the Email templates screen (A8). */
export interface EmailTemplateRow {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  /** Category, status and, for a system template, "System". */
  readonly chips: readonly ChipView[];
  /** "Updated 2026-10-08 16:40 UTC by admin@saturdaze.app". */
  readonly updated: string;
  readonly datetime: string;
  /** The editor (A9) for this template. */
  readonly href: string;
}

export const EMAIL_TEMPLATE_CATEGORIES: readonly {
  readonly value: EmailTemplateCategory;
  readonly label: string;
}[] = [
  { value: 'Account', label: 'Account' },
  { value: 'Notification', label: 'Notification' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'SpecialOccasion', label: 'Special occasion' },
  { value: 'Marketing', label: 'Marketing' },
];

export const EMAIL_TEMPLATE_STATUSES: readonly EmailTemplateStatus[] = [
  'Draft',
  'Active',
  'Archived',
];

export const DEFAULT_EMAIL_TEMPLATES_QUERY: EmailTemplatesQuery = {
  q: '',
  category: null,
  status: null,
};

/** Reads the screen's filters from the URL; unknown values fall back to "all". */
export function parseEmailTemplatesQuery(get: (key: string) => string | null): EmailTemplatesQuery {
  const category = get('category');
  const status = get('status');
  return {
    q: get('q')?.trim() ?? '',
    category: EMAIL_TEMPLATE_CATEGORIES.some((c) => c.value === category)
      ? (category as EmailTemplateCategory)
      : null,
    status: EMAIL_TEMPLATE_STATUSES.includes(status as EmailTemplateStatus)
      ? (status as EmailTemplateStatus)
      : null,
  };
}

/** The URL query for the filters; "all" and an empty search are left out. */
export function toEmailTemplatesParams(query: EmailTemplatesQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.q) params['q'] = query.q;
  if (query.category) params['category'] = query.category;
  if (query.status) params['status'] = query.status;
  return params;
}
