import { MemberAccess } from './member-row';

/**
 * Server-side shape of `GET /api/family`. Mirrors `Saturdaze.Application
 * .Contracts.FamilyProfileDto` plus the nested member / commitment /
 * preference dtos.
 */
export interface FamilyDto {
  /**
   * Id.
   */
  readonly id: string;
  /**
   * Name — "The Browns"; `null` when the family has not been named.
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
   * Is Owner — the caller owns the family and changes who's in (L2-124).
   */
  readonly isOwner: boolean;
  /**
   * Owner Email — `null` for a family no account has created.
   */
  readonly ownerEmail: string | null;
  /**
   * Members — `email` is the invited or signed-in address, `null` for `None`.
   */
  readonly members: readonly {
    id: string;
    name: string;
    age: number;
    access: MemberAccess;
    email: string | null;
  }[];
  /**
   * Commitments.
   */
  readonly commitments: readonly {
    id: string;
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  /**
   * Preferences.
   */
  readonly preferences: readonly {
    id: string;
    kind: 'Like' | 'Dislike';
    value: string;
  }[];
}
