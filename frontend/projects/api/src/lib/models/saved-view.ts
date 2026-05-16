import { AvoidItem } from './avoid-item';
import { SavedFilter } from './saved-filter';
import { SavedWeekend } from './saved-weekend';

export interface SavedView {
  readonly heading: string;
  readonly lede: string;
  readonly filters: readonly SavedFilter[];
  readonly recent: readonly SavedWeekend[];
  readonly avoid: readonly AvoidItem[];
}
