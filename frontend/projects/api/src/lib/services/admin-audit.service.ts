import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { AuditPageView, AuditRow, IngestionRunSkipsView } from '../models/admin/audit-row';
import { IngestionPhotoSkipsDto } from '../models/admin/ingestion-skips.dto';
import {
  PhotoAuditAction,
  PhotoAuditEntryDto,
  PhotoAuditPageDto,
  PhotoAuditQuery,
} from '../models/admin/photo-audit.dto';
import { ChipView } from '../models/chip-view';
import { IAdminAuditService } from './admin-audit.service.contract';

const ACTION_CHIP: Record<PhotoAuditAction, ChipView> = {
  upload: { tone: 'accent', label: 'Upload' },
  addUrl: { tone: 'accent', label: 'Add URL' },
  edit: { tone: 'sky', label: 'Edit' },
  primary: { tone: 'primary', label: 'Primary' },
  remove: { tone: 'warn', label: 'Remove' },
  review: { tone: 'sun', label: 'Review' },
};

const STATUS_CHIP: Record<IngestionPhotoSkipsDto['status'], ChipView> = {
  Running: { tone: 'neutral', label: 'Running' },
  Succeeded: { tone: 'accent', label: 'Succeeded' },
  PartialSuccess: { tone: 'sun', label: 'Partial' },
  Failed: { tone: 'warn', label: 'Failed' },
};

type Values = Record<string, unknown>;

function parse(json: string | null): Values {
  if (!json) return {};
  try {
    const v: unknown = JSON.parse(json);
    return v && typeof v === 'object' ? (v as Values) : {};
  } catch {
    return {};
  }
}

/** "https://x/y/memorial-park.jpg" → "memorial-park.jpg"; a blank → "—". */
export function fileName(url: unknown): string {
  if (typeof url !== 'string' || !url) return '—';
  const path = url.split(/[?#]/)[0] ?? '';
  const last = path.split('/').filter(Boolean).pop() ?? '';
  try {
    return decodeURIComponent(last) || url;
  } catch {
    return last || url;
  }
}

function kb(bytes: unknown): string {
  return typeof bytes === 'number' ? `${Math.max(1, Math.round(bytes / 1024))} KB` : '';
}

function text(v: unknown): string {
  return typeof v === 'string' && v.trim() ? v : '—';
}

/** "2026-10-06T14:02:00+00:00" → "2026-10-06 14:02 UTC". */
export function utcStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-06T04:12:00+00:00" → "6 Oct 2026, 04:12 UTC". */
export function utcWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}, ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}

/** The one-line "what changed" of an entry, as the mock words each action (L2-122 AC4). */
export function changeText(entry: PhotoAuditEntryDto): string {
  const before = parse(entry.before);
  const after = parse(entry.after);
  switch (entry.action) {
    case 'upload': {
      const size = kb(after['bytes']);
      return `Added ${fileName(after['url'])} · ${after['width']} × ${after['height']}${size ? ` · ${size}` : ''}`;
    }
    case 'addUrl':
      return `Added ${fileName(after['url'])} · ${after['width']} × ${after['height']}`;
    case 'edit': {
      const fields: [string, string][] = [
        ['alt', 'Alt text'],
        ['attribution', 'Attribution'],
        ['licence', 'Licence'],
      ];
      const changes = fields
        .filter(([key]) => text(before[key]) !== text(after[key]))
        .map(([key, label]) => `${label}: ${text(before[key])} → ${text(after[key])}`);
      return changes.length ? changes.join(' · ') : 'No change';
    }
    case 'primary':
      return `${fileName(before['url'])} → ${fileName(after['url'])}`;
    case 'remove': {
      const next = before['nextPrimaryUrl'];
      return `Removed ${fileName(before['url'])} · next primary: ${before['primary'] ? fileName(next) : 'unchanged'}`;
    }
    case 'review': {
      const verb =
        after['decision'] === 'reject'
          ? 'Rejected'
          : after['decision'] === 'primary'
            ? 'Made primary'
            : 'Kept';
      const reason =
        typeof after['reason'] === 'string' && after['reason'] ? ` · ${after['reason']}` : '';
      return `${verb} ${fileName(before['url'])}${reason}`;
    }
  }
}

export function toAuditRow(entry: PhotoAuditEntryDto): AuditRow {
  return {
    id: entry.id,
    time: utcStamp(entry.occurredAt),
    datetime: entry.occurredAt,
    who: entry.adminEmail,
    adminId: entry.adminId,
    kind: entry.kind,
    placeId: entry.placeId,
    placeName: entry.placeName,
    placeHref: `/places/${entry.kind}/${entry.placeId}`,
    action: ACTION_CHIP[entry.action] ?? { tone: 'neutral', label: entry.action },
    change: changeText(entry),
  };
}

export function toIngestionRunSkips(dto: IngestionPhotoSkipsDto): IngestionRunSkipsView {
  const n = dto.skips.length;
  return {
    runId: dto.runId,
    type: dto.type,
    meta: `${utcWhen(dto.startedUtc)} · ${n} photo skip${n === 1 ? '' : 's'}`,
    status: STATUS_CHIP[dto.status] ?? { tone: 'neutral', label: dto.status },
    skips: dto.skips.map((s) => ({
      placeName: s.placeName,
      placeHref: s.kind && s.placeId ? `/places/${s.kind}/${s.placeId}` : null,
      reason: s.reason,
      url: s.url,
    })),
  };
}

/** HTTP implementation of `IAdminAuditService`. */
@Injectable({ providedIn: 'root' })
export class AdminAuditService implements IAdminAuditService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async list(query: PhotoAuditQuery): Promise<AuditPageView> {
    let params = new HttpParams().set('page', String(query.page));
    if (query.kind) params = params.set('kind', query.kind);
    if (query.placeId) params = params.set('placeId', query.placeId);
    if (query.adminId) params = params.set('adminId', query.adminId);
    const dto = await firstValueFrom(
      this.http.get<PhotoAuditPageDto>(`${this.baseUrl}/api/admin/photo-audit`, { params }),
    );
    return {
      rows: dto.items.map(toAuditRow),
      total: dto.total,
      page: dto.page,
      pageSize: dto.pageSize,
    };
  }

  async ingestionSkips(): Promise<IngestionRunSkipsView[]> {
    const runs = await firstValueFrom(
      this.http.get<IngestionPhotoSkipsDto[]>(
        `${this.baseUrl}/api/admin/ingestion-runs/photo-skips`,
      ),
    );
    return runs.map(toIngestionRunSkips);
  }
}
