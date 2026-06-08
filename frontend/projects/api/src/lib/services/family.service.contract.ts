import { InjectionToken, Signal } from '@angular/core';

import { FamilyProfile } from '../models/family-profile';

export type EditableFamilyDayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

/**
 * Editable Family Member.
 */
export interface EditableFamilyMember {
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
   * Title.
   */
  readonly title: string;
  /**
   * Day Of Week.
   */
  readonly dayOfWeek: EditableFamilyDayOfWeek;
  /**
   * Start Time.
   */
  readonly startTime: string;
  /**
   * End Time.
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
 * Editable Family Profile.
 */
export interface EditableFamilyProfile {
  /**
   * Home Location.
   */
  readonly homeLocation: string;
  /**
   * Budget Enabled.
   */
  readonly budgetEnabled: boolean;
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
export interface IFamilyService {
  /**
   * Get Profile.
   *
   * @returns {Signal<FamilyProfile>} The result of the operation
   */
  getProfile(): Signal<FamilyProfile>;
  /**
   * Get Editable Profile.
   *
   * @returns {Signal<EditableFamilyProfile | null>} The result of the operation
   */
  getEditableProfile(): Signal<EditableFamilyProfile | null>;
  /**
   * Load.
   *
   * @returns {Promise<void>} The result of the operation
   */
  load(): Promise<void>;
  /**
   * Save Profile.
   *
   * @param {EditableFamilyProfile} profile - The profile
   *
   * @returns {Promise<void>} The result of the operation
   */
  saveProfile(profile: EditableFamilyProfile): Promise<void>;
}

export const FAMILY_SERVICE = new InjectionToken<IFamilyService>(
  'FAMILY_SERVICE',
);
