export type VoterTone = 'leaf' | 'sky' | 'sun' | 'primary' | 'indoor';
export type Vote = 'up' | 'down' | 'none';

export interface FamilyVote {
  readonly name: string;
  readonly tone: VoterTone;
  readonly vote: Vote;
}

export interface Restaurant {
  readonly name: string;
  readonly style: string;
  readonly near?: string;
  readonly drive?: string;
  readonly wifeapproved?: boolean;
  readonly icon?: string;
  readonly votes: readonly FamilyVote[];
}

export interface RestaurantSection {
  readonly title: string;
  readonly subtitle?: string;
  readonly picks: readonly Restaurant[];
}

export interface RestaurantFilter {
  readonly label: string;
  readonly tone: 'default' | 'primary' | 'accent' | 'sky' | 'leaf';
}

export interface RestaurantView {
  readonly title: string;
  readonly lede: string;
  readonly filters: readonly RestaurantFilter[];
  readonly topPickSection: RestaurantSection;
  readonly otherPicks: RestaurantSection;
  readonly sundayDinner: RestaurantSection;
}
