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
   * Members.
   */
  readonly members: ReadonlyArray<{ id: string; name: string; age: number }>;
  /**
   * Commitments.
   */
  readonly commitments: ReadonlyArray<{
    id: string;
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  /**
   * Preferences.
   */
  readonly preferences: ReadonlyArray<{
    id: string;
    kind: 'Like' | 'Dislike';
    value: string;
  }>;
}
