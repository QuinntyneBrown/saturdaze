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
