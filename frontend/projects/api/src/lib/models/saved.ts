export interface SavedWeekend {
  readonly date: string;
  readonly title: string;
  readonly rating: number;
  readonly highlights: string;
  readonly favourite?: boolean;
}

export interface AvoidItem {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: string;
}

export interface SavedFilter {
  readonly label: string;
  readonly icon?: string;
  readonly tone: 'default' | 'primary' | 'accent';
}

export interface SavedView {
  readonly heading: string;
  readonly lede: string;
  readonly filters: readonly SavedFilter[];
  readonly recent: readonly SavedWeekend[];
  readonly avoid: readonly AvoidItem[];
}
