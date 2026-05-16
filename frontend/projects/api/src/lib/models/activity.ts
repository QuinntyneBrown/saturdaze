export type ActivityTone = 'default' | 'outdoor' | 'indoor' | 'food';

export interface Activity {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon: string;
  readonly tone: ActivityTone;
  readonly drive?: string;
  readonly ages?: string;
  readonly tag?: string;
  readonly why?: string;
}

export interface ActivitySection {
  readonly title: string;
  readonly subtitle?: string;
  readonly activities: readonly Activity[];
}

export interface ActivityFilter {
  readonly label: string;
  readonly tone: 'default' | 'primary' | 'leaf' | 'indoor' | 'sky' | 'sun' | 'warn' | 'accent';
}

export interface ActivityView {
  readonly filters: readonly ActivityFilter[];
  readonly sections: readonly ActivitySection[];
}
