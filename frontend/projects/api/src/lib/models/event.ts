export interface LocalEvent {
  readonly title: string;
  readonly venue: string;
  readonly when: string;
  readonly drive?: string;
  readonly dateDay: string;
  readonly dateMon: string;
  readonly tag?: string;
}

export interface EventSection {
  readonly title: string;
  readonly events: readonly LocalEvent[];
}

export interface EventFilter {
  readonly label: string;
  readonly tone: 'default' | 'primary' | 'leaf' | 'indoor' | 'sun';
}

export interface EventsView {
  readonly heading: string;
  readonly lede: string;
  readonly filters: readonly EventFilter[];
  readonly sections: readonly EventSection[];
}
