import { InjectionToken, Signal } from '@angular/core';

import { DayOfWeek } from '../models/day-of-week';
import { FamilyView } from '../models/family-view';

/** Kept for callers that used the older name. */
export type EditableFamilyDayOfWeek = DayOfWeek;

/**
 * Editable Family Member.
 */
export interface EditableFamilyMember {
  /**
   * Id — present for persisted members so a rename keeps its identity.
   */
  readonly id?: string;
  /**
   * Name.
   */
  readonly name: string;
  /**
   * Age.
   */
  readonly age: number;
}

/**
 * Editable Commitment.
 */
export interface EditableCommitment {
  /**
   * Id — present for persisted commitments so an edit keeps its identity.
   */
  readonly id?: string;
  /**
   * Title.
   */
  readonly title: string;
  /**
   * Day Of Week.
   */
  readonly dayOfWeek: DayOfWeek;
  /**
   * Start Time — "HH:mm".
   */
  readonly startTime: string;
  /**
   * End Time — "HH:mm".
   */
  readonly endTime: string;
}

/**
 * Editable Preference.
 */
export interface EditablePreference {
  /**
   * Kind.
   */
  readonly kind: 'Like' | 'Dislike';
  /**
   * Value.
   */
  readonly value: string;
}

/**
 * Editable Family Profile — the full-replace payload for `PUT /api/family`.
 */
export interface EditableFamilyProfile {
  /**
   * Name — "The Browns"; `null` when unnamed.
   */
  readonly name: string | null;
  /**
   * Home Location.
   */
  readonly homeLocation: string;
  /**
   * Budget Enabled.
   */
  readonly budgetEnabled: boolean;
  /**
   * Try New Enabled.
   */
  readonly tryNewEnabled: boolean;
  /**
   * Friday Preview Enabled.
   */
  readonly fridayPreviewEnabled: boolean;
  /**
   * Members.
   */
  readonly members: readonly EditableFamilyMember[];
  /**
   * Commitments.
   */
  readonly commitments: readonly EditableCommitment[];
  /**
   * Preferences.
   */
  readonly preferences: readonly EditablePreference[];
}

/**
 * I Family Service.
 */
/** A member the owner adds: `email` invites them to sign in (L2-125, L2-126). */
export interface NewFamilyMember {
  readonly name: string;
  readonly age: number;
  readonly email: string | null;
}

/** The invitation the owner shares with an invited member (L2-126). */
export interface FamilyInvite {
  readonly email: string;
  readonly token: string;
  /** The accept-invite link. */
  readonly url: string;
  readonly expiresAtUtc: string;
}

export interface IFamilyService {
  /**
   * Get Family — the read-only projection for the Family page.
   *
   * @returns {Signal<FamilyView>} The result of the operation
   */
  getFamily(): Signal<FamilyView>;
  /**
   * Get Editable Profile — `null` until the first load lands.
   *
   * @returns {Signal<EditableFamilyProfile | null>} The result of the operation
   */
  getEditableProfile(): Signal<EditableFamilyProfile | null>;
  /**
   * Load — `GET /api/family`.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(): Promise<void>;
  /**
   * Save Profile — `PUT /api/family` (full replace).
   *
   * @param {EditableFamilyProfile} profile - The profile
   *
   * @returns {Promise<void>} The result of the operation
   */
  saveProfile(profile: EditableFamilyProfile): Promise<void>;
  /**
   * Add Member — `POST /api/family/members`, then reload. Owner only.
   *
   * @param {NewFamilyMember} member - The member
   *
   * @returns {Promise<FamilyInvite | null>} The invite to share, or `null` when they will not sign in
   */
  addMember(member: NewFamilyMember): Promise<FamilyInvite | null>;
  /**
   * Remove Member — `DELETE /api/family/members/{id}`, then reload. Owner only.
   *
   * @param {string} id - The member id
   *
   * @returns {Promise<void>} The result of the operation
   */
  removeMember(id: string): Promise<void>;
}

export const FAMILY_SERVICE = new InjectionToken<IFamilyService>('FAMILY_SERVICE');
