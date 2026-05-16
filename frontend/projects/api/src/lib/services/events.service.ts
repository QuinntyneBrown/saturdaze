import { Injectable, Signal, signal } from '@angular/core';

import { EventsView } from '../models/event';

const DEMO_VIEW: EventsView = {
  heading: "What's on this weekend",
  lede:
    'Within 45 minutes of Port Credit. Tap "Add" to slot it into your weekend.',
  filters: [
    { label: 'This weekend', tone: 'primary' },
    { label: 'Next weekend', tone: 'default' },
    { label: 'Outdoor', tone: 'leaf' },
    { label: 'Indoor', tone: 'indoor' },
    { label: 'Seasonal', tone: 'sun' },
    { label: 'Theatre', tone: 'default' },
    { label: 'Festivals', tone: 'default' },
  ],
  sections: [
    {
      title: 'Saturday',
      events: [
        {
          title: 'Terre Bleu — Lavender Bloom Opening',
          venue: 'Milton',
          when: '10am – 5pm',
          drive: '45 min',
          dateDay: '17',
          dateMon: 'MAY',
          tag: 'Seasonal',
        },
        {
          title: 'Cirque Mechanics — Pedal Punk',
          venue: 'Living Arts Centre',
          when: '2pm matinée',
          drive: '5 min',
          dateDay: '17',
          dateMon: 'MAY',
          tag: 'Circus',
        },
        {
          title: 'Spring Tulip Festival',
          venue: 'Royal Botanical Gardens',
          when: 'all weekend',
          drive: '35 min',
          dateDay: '17',
          dateMon: 'MAY',
          tag: 'Festival',
        },
      ],
    },
    {
      title: 'Sunday',
      events: [
        {
          title: 'Mississauga Symphony — Kids Concert',
          venue: 'Living Arts Centre',
          when: '11am',
          drive: '5 min',
          dateDay: '18',
          dateMon: 'MAY',
          tag: 'Theatre',
        },
        {
          title: "Port Credit Farmer's Market",
          venue: 'Lakeshore Rd',
          when: '9am – 1pm',
          drive: '2 min',
          dateDay: '18',
          dateMon: 'MAY',
          tag: 'Local',
        },
      ],
    },
    {
      title: 'Coming soon',
      events: [
        {
          title: 'Strawberry-picking opens',
          venue: "Whittamore's Farm",
          when: 'Sat May 24',
          drive: '40 min',
          dateDay: '24',
          dateMon: 'MAY',
          tag: 'Seasonal',
        },
        {
          title: 'Pumpkin patch — early access',
          venue: "Downey's Farm",
          when: 'Sept 13',
          drive: '35 min',
          dateDay: '13',
          dateMon: 'SEP',
          tag: 'Save for later',
        },
      ],
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly view = signal<EventsView>(DEMO_VIEW);

  list(): Signal<EventsView> {
    return this.view.asReadonly();
  }
}
