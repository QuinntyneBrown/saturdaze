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

export interface EditableFamilyMember {
  readonly name: string;
  readonly age: number;
}

export interface EditableCommitment {
  readonly title: string;
  readonly dayOfWeek: EditableFamilyDayOfWeek;
  readonly startTime: string;
  readonly endTime: string;
}

export interface EditablePreference {
  readonly kind: 'Like' | 'Dislike';
  readonly value: string;
}

export interface EditableFamilyProfile {
  readonly homeLocation: string;
  readonly budgetEnabled: boolean;
  readonly members: readonly EditableFamilyMember[];
  readonly commitments: readonly EditableCommitment[];
  readonly preferences: readonly EditablePreference[];
}

export interface IFamilyService {
  getProfile(): Signal<FamilyProfile>;
  getEditableProfile(): Signal<EditableFamilyProfile | null>;
  load(): Promise<void>;
  saveProfile(profile: EditableFamilyProfile): Promise<void>;
}

export const FAMILY_SERVICE = new InjectionToken<IFamilyService>(
  'FAMILY_SERVICE',
);
