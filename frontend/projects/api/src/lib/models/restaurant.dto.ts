export interface RestaurantDto {
  readonly id: string;
  readonly name: string;
  readonly style: string;
  readonly slot: 'Lunch' | 'Dinner';
  readonly wifeApproved: boolean;
  readonly driveMinutes: number;
  readonly notes: string;
  readonly menuUrl?: string | null;
  readonly votes?: ReadonlyArray<{
    readonly voterName: string;
    readonly vote: 'up' | 'down' | 'none';
  }> | null;
  readonly locked?: boolean;
}
