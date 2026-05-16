import { Activity } from './activity';

export interface ActivitySection {
  readonly title: string;
  readonly subtitle?: string;
  readonly activities: readonly Activity[];
}
