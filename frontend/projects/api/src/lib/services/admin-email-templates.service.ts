import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import {
  CreateEmailTemplateRequest,
  EmailTemplateCategory,
  EmailTemplateDto,
  EmailTemplateStatus,
  EmailTemplateSummaryDto,
  EmailTemplatesQuery,
  SaveEmailTemplateRequest,
} from '../models/admin/email-template.dto';
import {
  EmailTemplateRow,
  EmailTemplateView,
  categoryLabel,
  toEmailTemplatesParams,
} from '../models/admin/email-template-view';
import { ChipView } from '../models/chip-view';
import { utcStamp } from './admin-audit.service';
import { IAdminEmailTemplatesService } from './admin-email-templates.service.contract';

const CATEGORY_TONE: Record<EmailTemplateCategory, ChipView['tone']> = {
  Account: 'primary',
  Notification: 'sky',
  Scheduled: 'leaf',
  SpecialOccasion: 'sun',
  Marketing: 'indoor',
};

const STATUS_TONE: Record<EmailTemplateStatus, ChipView['tone']> = {
  Draft: 'default',
  Active: 'accent',
  Archived: 'warn',
};

export function categoryChip(category: EmailTemplateCategory): ChipView {
  return { tone: CATEGORY_TONE[category] ?? 'default', label: categoryLabel(category) };
}

export function statusChip(status: EmailTemplateStatus): ChipView {
  return { tone: STATUS_TONE[status] ?? 'default', label: status };
}

export const SYSTEM_CHIP: ChipView = { tone: 'default', icon: 'lock', label: 'System' };

export function toEmailTemplateRow(dto: EmailTemplateSummaryDto): EmailTemplateRow {
  const chips = [categoryChip(dto.category), statusChip(dto.status)];
  if (dto.isSystem) chips.push(SYSTEM_CHIP);
  return {
    id: dto.id,
    key: dto.key,
    name: dto.name,
    chips,
    updated: `Updated ${utcStamp(dto.updatedAt)} by ${dto.updatedByEmail}`,
    datetime: dto.updatedAt,
    href: `/email-templates/${dto.id}`,
  };
}

export function toEmailTemplateView(dto: EmailTemplateDto): EmailTemplateView {
  const chips = [statusChip(dto.status)];
  if (dto.isSystem) chips.push(SYSTEM_CHIP);
  const label = categoryLabel(dto.category);
  return {
    ...dto,
    categoryLabel: label,
    meta: `${dto.key} · ${label} · version ${dto.version} · updated ${utcStamp(dto.updatedAt)} by ${dto.updatedByEmail}`,
    chips,
  };
}

/** HTTP implementation of `IAdminEmailTemplatesService`. */
@Injectable({ providedIn: 'root' })
export class AdminEmailTemplatesService implements IAdminEmailTemplatesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async list(query: EmailTemplatesQuery): Promise<EmailTemplateRow[]> {
    const params = new HttpParams({ fromObject: toEmailTemplatesParams(query) });
    const rows = await firstValueFrom(
      this.http.get<EmailTemplateSummaryDto[]>(this.url, {
        params,
      }),
    );
    return rows.map(toEmailTemplateRow);
  }

  async get(id: string): Promise<EmailTemplateView> {
    const dto = await firstValueFrom(
      this.http.get<EmailTemplateDto>(`${this.url}/${encodeURIComponent(id)}`),
    );
    return toEmailTemplateView(dto);
  }

  async create(request: CreateEmailTemplateRequest): Promise<EmailTemplateView> {
    const dto = await firstValueFrom(this.http.post<EmailTemplateDto>(this.url, request));
    return toEmailTemplateView(dto);
  }

  async save(id: string, request: SaveEmailTemplateRequest): Promise<EmailTemplateView> {
    const dto = await firstValueFrom(
      this.http.put<EmailTemplateDto>(`${this.url}/${encodeURIComponent(id)}`, request),
    );
    return toEmailTemplateView(dto);
  }

  private get url(): string {
    return `${this.baseUrl}/api/admin/email-templates`;
  }
}
