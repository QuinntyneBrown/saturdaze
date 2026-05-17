export interface SavedWeekend {
  readonly id: string;
  readonly date: string;
  readonly title: string;
  readonly rating: number;
  readonly highlights: string;
  readonly favourite?: boolean;
}
