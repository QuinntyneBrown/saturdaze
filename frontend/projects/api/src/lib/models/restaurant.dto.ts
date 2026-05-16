export interface RestaurantDto {
  readonly id: string;
  readonly name: string;
  readonly style: string;
  readonly slot: 'Lunch' | 'Dinner';
  readonly wifeApproved: boolean;
  readonly driveMinutes: number;
  readonly notes: string;
}
