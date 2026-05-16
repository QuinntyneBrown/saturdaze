import { Injectable, Signal, signal } from '@angular/core';

import { SavedView } from '../models/saved';

const DEMO_VIEW: SavedView = {
  heading: 'Your weekends',
  lede: "12 weekends planned. Repeat what worked, remix what didn't.",
  filters: [
    { label: 'All', tone: 'primary' },
    { label: 'Favourites', icon: 'heart', tone: 'accent' },
    { label: 'This year', tone: 'default' },
    { label: '5★ only', tone: 'default' },
  ],
  recent: [
    {
      date: 'May 10–11, 2026',
      title: 'Bronte Creek + Rec Room',
      rating: 5,
      favourite: true,
      highlights:
        'Mae found a frog. Eli won the basketball arcade. Pasta night was a hit.',
    },
    {
      date: 'May 3–4, 2026',
      title: 'Stay-home reset',
      rating: 3,
      highlights:
        'Rained Saturday. Indoor crafts saved it; Sunday hike at Riverwood.',
    },
    {
      date: 'Apr 26–27, 2026',
      title: 'Zoo + lavender preview',
      rating: 4,
      highlights:
        'First lavender sprouts. Kids tired by 3pm — adjust pacing next time.',
    },
  ],
  avoid: [
    {
      title: 'Rec Room — Square One',
      subtitle: 'Last visit: May 10',
      icon: 'popcorn',
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class SavedService {
  private readonly view = signal<SavedView>(DEMO_VIEW);

  list(): Signal<SavedView> {
    return this.view.asReadonly();
  }
}
