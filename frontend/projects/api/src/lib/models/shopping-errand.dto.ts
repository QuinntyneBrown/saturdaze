export interface ShoppingErrandDto {
  readonly id: string;
  readonly description: string;
  readonly estimatedMinutes: number;
  readonly done: boolean;
}
