import { ChipView } from '../chip-view';
import {
  EmailSampleData,
  EmailTemplateCategory,
  EmailTemplateDto,
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

/** A template in the editor (A9): its content plus the header's chips and line. */
export interface EmailTemplateView extends EmailTemplateDto {
  readonly categoryLabel: string;
  /** "account.password-reset · Account · version 4 · updated 2026-10-08 16:40 UTC by admin@saturdaze.app". */
  readonly meta: string;
  /** Status and, for a system template, "System". */
  readonly chips: readonly ChipView[];
}

/** Lowercase letters and digits in words joined by dots or hyphens (the API's key rule). */
export const EMAIL_TEMPLATE_KEY_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

/** "Birthday wishes!" → "birthday-wishes": the key AD7 suggests from a name (L2-126 AC5). */
export function suggestTemplateKey(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '');
}

export function categoryLabel(category: EmailTemplateCategory): string {
  return EMAIL_TEMPLATE_CATEGORIES.find((c) => c.value === category)?.label ?? category;
}

/**
 * Reads the editor's sample data text (L2-127 AC8): the parsed JSON object, or
 * `null` when the text is not a JSON object. Blank text is an empty object.
 */
export function parseSampleData(text: string): EmailSampleData | null {
  if (!text.trim()) return {};
  try {
    const value: unknown = JSON.parse(text);
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as EmailSampleData)
      : null;
  } catch {
    return null;
  }
}

/** Sample data as the editor shows it: indented JSON. */
export function formatSampleData(data: EmailSampleData): string {
  return JSON.stringify(data, null, 2);
}

/** One row of the History dialog (AD9). */
export interface EmailRevisionRow {
  readonly version: number;
  /** "v2 · Edit · 2026-10-08 16:40 UTC · admin@saturdaze.app". */
  readonly meta: string;
  readonly subject: string;
  readonly datetime: string;
}
