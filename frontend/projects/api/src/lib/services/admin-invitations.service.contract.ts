import { InjectionToken } from '@angular/core';

import { InvitationRow, ProspectRow } from '../models/admin/invitation-row';
import { SendInvitationsRequest } from '../models/admin/platform-invitation.dto';
import { CreateProspectRequest, ProspectDto } from '../models/admin/prospect.dto';
import { WeekendView } from '../models/weekend-view';

/** A prospect with its weekend projected for the Sample weekend screen (A10). */
export interface ProspectView {
  readonly prospect: ProspectDto;
  readonly row: ProspectRow;
  /** "Dani 38, Mateo 7". */
  readonly membersText: string;
  readonly weekend: WeekendView;
}

/**
 * Contract for Saturdaze Admin's platform invitations (L2-157, L2-158) and
 * prospective families with their sample weekends (L2-159, L2-160). Admin
 * pages inject `ADMIN_INVITATIONS_SERVICE` and depend only on this interface.
 */
export interface IAdminInvitationsService {
  /** `GET /api/admin/invitations`: newest first. */
  list(): Promise<InvitationRow[]>;
  /** `POST /api/admin/invitations`: the new rows, newest first. */
  send(request: SendInvitationsRequest): Promise<InvitationRow[]>;
  /** `DELETE /api/admin/invitations/{id}`. */
  revoke(id: string): Promise<void>;
  /** `GET /api/admin/prospects`: newest first. */
  prospects(): Promise<ProspectRow[]>;
  /** `GET /api/admin/prospects/{id}` with its weekend. */
  prospect(id: string): Promise<ProspectView>;
  /** `POST /api/admin/prospects`. */
  createProspect(request: CreateProspectRequest): Promise<ProspectView>;
  /** `POST /api/admin/prospects/{id}/weekend/regenerate`. */
  regenerate(id: string): Promise<WeekendView>;
  /** `POST /api/admin/prospects/{id}/blocks/{blockId}/swap`. */
  swapBlock(id: string, blockId: string): Promise<WeekendView>;
  /** `PUT /api/admin/prospects/{id}/blocks/{blockId}/lock`. */
  lockBlock(id: string, blockId: string, locked: boolean): Promise<WeekendView>;
}

export const ADMIN_INVITATIONS_SERVICE = new InjectionToken<IAdminInvitationsService>(
  'ADMIN_INVITATIONS_SERVICE',
);
