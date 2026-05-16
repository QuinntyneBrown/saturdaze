export interface ActivityFilter {
  readonly label: string;
  readonly tone: 'default' | 'primary' | 'leaf' | 'indoor' | 'sky' | 'sun' | 'warn' | 'accent';
}
