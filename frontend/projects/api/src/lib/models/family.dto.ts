/**
 * Server-side shape of `GET /api/family`. Mirrors `Saturdaze.Application
 * .Contracts.FamilyProfileDto` plus the nested member / commitment /
 * preference dtos.
 */
export interface FamilyDto {
  readonly id: string;
  readonly homeLocation: string;
  readonly budgetEnabled: boolean;
  readonly members: ReadonlyArray<{ id: string; name: string; age: number }>;
  readonly commitments: ReadonlyArray<{
    id: string;
    title: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  readonly preferences: ReadonlyArray<{
    id: string;
    kind: 'Like' | 'Dislike';
    value: string;
  }>;
}
