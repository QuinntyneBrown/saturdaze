export interface ItineraryBlockDto {
  readonly id: string;
  readonly day: 'Saturday' | 'Sunday';
  readonly startTime: string; // HH:mm:ss
  readonly endTime: string;
  readonly kind: 'Workout' | 'Activity' | 'Meal' | 'Drive' | 'Downtime' | 'Commitment' | 'Errand';
  readonly title: string;
  readonly refId: string | null;
  readonly isLocked: boolean;
  readonly reason: string;
  readonly sortOrder: number;
}
