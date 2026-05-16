export interface DayChip {
  readonly tone: 'default' | 'sun' | 'sky' | 'leaf' | 'indoor' | 'warn' | 'accent' | 'primary';
  readonly icon?: string;
  readonly label: string;
}
