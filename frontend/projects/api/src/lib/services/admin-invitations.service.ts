import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api/api-base-url';
import { timeAgo } from '../api/format';
import { formatWeekendSpan, monthAbbr, parseIsoDate } from '../api/weekend-dates';
import { projectWeekend } from '../api/weekend-projection';
import { InvitationRow, ProspectRow } from '../models/admin/invitation-row';
import {
  PlatformInvitationDto,
  SendInvitationsRequest,
  SendInvitationsResultDto,
} from '../models/admin/platform-invitation.dto';
import { CreateProspectRequest, ProspectDto } from '../models/admin/prospect.dto';
import { ChipView } from '../models/chip-view';
import { WeekendDto } from '../models/weekend.dto';
import { WeekendView } from '../models/weekend-view';
import { IAdminInvitationsService, ProspectView } from './admin-invitations.service.contract';

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Sat 24 Oct": the Saturday as the mock's AD7 option and sample line write it. */
export function formatSaturday(saturdayIso: string): string {
  const d = parseIsoDate(saturdayIso);
  return `Sat ${d.getUTCDate()} ${monthAbbr(d)}`;
}

/** Whole days left until `expiresIso`, never below zero; 14 right after sending (L2-157 AC9). */
export function daysUntil(expiresIso: string, now: number): number {
  return Math.max(0, Math.ceil((Date.parse(expiresIso) - now) / DAY_MS));
}

const STATUS_CHIP: Record<PlatformInvitationDto['status'], ChipView> = {
  Pending: { tone: 'sun', label: 'Invite sent' },
  Accepted: { tone: 'accent', icon: 'check', label: 'Accepted' },
  Expired: { tone: 'warn', label: 'Expired' },
  Revoked: { tone: 'neutral', label: 'Revoked' },
};

export function toInvitationRow(
  dto: PlatformInvitationDto,
  now: number = Date.now(),
): InvitationRow {
  const sample = dto.sampleWeekend
    ? `Sample weekend · ${dto.sampleWeekend.familyName} · ${formatSaturday(dto.sampleWeekend.weekendOf)}`
    : 'No sample weekend';
  const by = `Invited by ${dto.invitedByEmail ?? 'Saturdaze'} · ${timeAgo(dto.createdAtUtc, now)}`;
  const tail =
    dto.status === 'Pending'
      ? `Expires in ${daysUntil(dto.expiresAtUtc, now)} days`
      : dto.status === 'Accepted'
        ? `Accepted ${timeAgo(dto.acceptedAtUtc ?? dto.createdAtUtc, now)}`
        : dto.status === 'Expired'
          ? `Expired ${timeAgo(dto.expiresAtUtc, now)}`
          : 'Revoked';
  return {
    id: dto.id,
    email: dto.email,
    sample,
    meta: `${by} · ${tail}`,
    status: STATUS_CHIP[dto.status],
    canRevoke: dto.status === 'Pending',
  };
}

/** "Dani 38, Mateo 7". */
export function membersText(dto: ProspectDto): string {
  return dto.members.map((m) => `${m.name} ${m.age}`).join(', ');
}

function prospectChip(dto: ProspectDto): ChipView {
  if (dto.status === 'Claimed') return { tone: 'accent', icon: 'check', label: 'Claimed' };
  if (dto.status === 'Invited') return { tone: 'sun', label: `Invited · ${dto.invitationCount}` };
  return { tone: 'neutral', label: 'Draft' };
}

export function toProspectRow(dto: ProspectDto): ProspectRow {
  const parts = [formatWeekendSpan(dto.weekendOf), membersText(dto)];
  if (dto.homeLocation) parts.push(dto.homeLocation.split(',')[0].trim());
  return {
    id: dto.id,
    familyName: dto.familyName,
    meta: parts.join(' · '),
    status: prospectChip(dto),
    href: `/invitations/samples/${dto.id}`,
    optionLabel: `${dto.familyName} · ${formatSaturday(dto.weekendOf)}`,
  };
}

export function toProspectView(dto: ProspectDto): ProspectView {
  return {
    prospect: dto,
    row: toProspectRow(dto),
    membersText: membersText(dto),
    weekend: projectWeekend(dto.weekend, dto.weekend ? 'ready' : 'empty'),
  };
}

/** HTTP implementation of `IAdminInvitationsService`. */
@Injectable({ providedIn: 'root' })
export class AdminInvitationsService implements IAdminInvitationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async list(): Promise<InvitationRow[]> {
    const rows = await firstValueFrom(
      this.http.get<PlatformInvitationDto[]>(`${this.baseUrl}/api/admin/invitations`),
    );
    const now = Date.now();
    return rows.map((r) => toInvitationRow(r, now));
  }

  async send(request: SendInvitationsRequest): Promise<InvitationRow[]> {
    const result = await firstValueFrom(
      this.http.post<SendInvitationsResultDto>(`${this.baseUrl}/api/admin/invitations`, request),
    );
    const now = Date.now();
    return result.invitations.map((r) => toInvitationRow(r, now));
  }

  async revoke(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}/api/admin/invitations/${encodeURIComponent(id)}`),
    );
  }

  async prospects(): Promise<ProspectRow[]> {
    const rows = await firstValueFrom(
      this.http.get<ProspectDto[]>(`${this.baseUrl}/api/admin/prospects`),
    );
    return rows.map(toProspectRow);
  }

  async prospect(id: string): Promise<ProspectView> {
    return toProspectView(await firstValueFrom(this.http.get<ProspectDto>(this.prospectUrl(id))));
  }

  async createProspect(request: CreateProspectRequest): Promise<ProspectView> {
    return toProspectView(
      await firstValueFrom(
        this.http.post<ProspectDto>(`${this.baseUrl}/api/admin/prospects`, request),
      ),
    );
  }

  async regenerate(id: string): Promise<WeekendView> {
    return this.weekendOf(
      await firstValueFrom(
        this.http.post<WeekendDto>(`${this.prospectUrl(id)}/weekend/regenerate`, null),
      ),
    );
  }

  async swapBlock(id: string, blockId: string): Promise<WeekendView> {
    return this.weekendOf(
      await firstValueFrom(
        this.http.post<WeekendDto>(
          `${this.prospectUrl(id)}/blocks/${encodeURIComponent(blockId)}/swap`,
          null,
        ),
      ),
    );
  }

  async lockBlock(id: string, blockId: string, locked: boolean): Promise<WeekendView> {
    return this.weekendOf(
      await firstValueFrom(
        this.http.put<WeekendDto>(
          `${this.prospectUrl(id)}/blocks/${encodeURIComponent(blockId)}/lock`,
          { locked },
        ),
      ),
    );
  }

  private prospectUrl(id: string): string {
    return `${this.baseUrl}/api/admin/prospects/${encodeURIComponent(id)}`;
  }

  private weekendOf(dto: WeekendDto): WeekendView {
    return projectWeekend(dto, 'ready');
  }
}
